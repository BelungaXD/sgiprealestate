import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { readdir, stat, copyFile, mkdir } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

// Lazy-load sharp to avoid import-time failure (e.g. linux-x64 runtime error in Docker)
let sharpModule: typeof import('sharp') | null | false = null
async function getSharp(): Promise<typeof import('sharp') | null> {
  if (sharpModule === false) return null
  if (sharpModule) return sharpModule
  try {
    sharpModule = (await import('sharp')).default
    return sharpModule
  } catch (err) {
    console.warn('[import-folder] sharp failed to load:', err)
    sharpModule = false
    return null
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '800mb',
    },
    maxDuration: 300, // 5 min for large imports
  },
}

// Поддерживаемые районы
const VALID_DISTRICTS = ['Beachfront', 'Downtown', 'Dubai Hills', 'Marina Shores', 'The Oasis']

// Расширения изображений
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv']
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']

// Получить MIME type
function getMimeType(filepath: string): string {
  const ext = extname(filepath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// Проверить соотношение сторон видео (16:9)
async function isVideo16x9(videoPath: string): Promise<boolean> {
  try {
    // Проверяем наличие ffprobe
    try {
      await execAsync('which ffprobe')
    } catch {
      console.warn('ffprobe not found, accepting all videos')
      return true // Если ffprobe не установлен, принимаем все видео
    }
    
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`
    )
    const [width, height] = stdout.trim().split('x').map(Number)
    if (!width || !height) return false
    
    const ratio = width / height
    // Проверяем, что соотношение близко к 16:9 (1.777...)
    return Math.abs(ratio - 16/9) < 0.1
  } catch (error) {
    console.error('Error checking video aspect ratio:', error)
    // В случае ошибки принимаем видео (лучше добавить, чем пропустить)
    return true
  }
}

// Конвертировать изображение в WebP (или копировать если sharp недоступен)
async function convertToWebP(sourcePath: string, destPath: string): Promise<string> {
  const sharp = await getSharp()
  if (sharp) {
    try {
      await sharp(sourcePath)
        .webp({ quality: 85 })
        .toFile(destPath)
      return destPath
    } catch (err) {
      console.warn('[import-folder] sharp error, copying image as-is:', err)
    }
  }
  const fallbackPath = destPath.replace(/\.webp$/i, extname(sourcePath))
  await copyFile(sourcePath, fallbackPath)
  return fallbackPath
}

// Копировать файл с конвертацией изображений в WebP
async function processFile(
  sourcePath: string,
  category: 'image' | 'video' | 'file'
): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
  const originalFilename = basename(sourcePath)
  const timestamp = Date.now()
  const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
  
  let destDir: string
  let uniqueFilename: string
  let finalPath: string

  if (category === 'image') {
    destDir = join(process.cwd(), 'public', 'uploads', 'properties', 'images')
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true })
    }
    
    // Конвертируем в WebP
    const ext = extname(originalFilename).toLowerCase()
    const nameWithoutExt = basename(originalFilename, ext)
    uniqueFilename = `${timestamp}-${nameWithoutExt}.webp`
    finalPath = join(destDir, uniqueFilename)
    
    // Если уже WebP, просто копируем, иначе конвертируем
    if (ext === '.webp') {
      await copyFile(sourcePath, finalPath)
    } else {
      finalPath = await convertToWebP(sourcePath, finalPath)
    }
  } else if (category === 'video') {
    destDir = join(process.cwd(), 'public', 'uploads', 'properties', 'videos')
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true })
    }
    uniqueFilename = `${timestamp}-${sanitizedFilename}`
    finalPath = join(destDir, uniqueFilename)
    await copyFile(sourcePath, finalPath)
  } else {
    destDir = join(process.cwd(), 'public', 'uploads', 'properties', 'files')
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true })
    }
    uniqueFilename = `${timestamp}-${sanitizedFilename}`
    finalPath = join(destDir, uniqueFilename)
    await copyFile(sourcePath, finalPath)
  }

  const stats = await stat(finalPath)
  return {
    url: finalPath.replace(join(process.cwd(), 'public'), ''),
    filename: uniqueFilename,
    size: stats.size,
    mimeType: getMimeType(finalPath),
  }
}

// Парсить название папки (РАЙОН - НАЗВАНИЕ)
function parseFolderName(folderName: string): { district: string | null; propertyName: string } {
  const parts = folderName.split(' - ').map(s => s.trim())
  
  if (parts.length >= 2) {
    const district = parts[0]
    const propertyName = parts.slice(1).join(' - ')
    
    // Проверяем, что район в списке допустимых
    if (VALID_DISTRICTS.includes(district)) {
      return { district, propertyName }
    }
  }
  
  // Если формат неверный, возвращаем название как есть
  return { district: null, propertyName: folderName }
}

// Генерировать SEO slug
function generateSlug(propertyName: string, district: string | null): string {
  let slug = propertyName.toLowerCase()
  if (district) {
    slug = `${district.toLowerCase()}-${slug}`
  }
  return slug
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Генерировать автоматическое описание
function generateDescription(propertyName: string, district: string | null): string {
  const districtText = district ? ` in ${district}` : ' in Dubai'
  return `Discover ${propertyName}, an exceptional luxury property${districtText}. This premium real estate opportunity offers world-class amenities, stunning architecture, and prime location. Perfect for investors seeking high returns and lifestyle excellence in the heart of Dubai.`
}

// Генерировать meta title
function generateMetaTitle(propertyName: string, district: string | null): string {
  const districtText = district ? ` in ${district}` : ''
  return `${propertyName}${districtText} - Luxury Real Estate | SGIP Real Estate`
}

// Генерировать meta description
function generateMetaDescription(propertyName: string, district: string | null): string {
  const districtText = district ? ` in ${district}` : ' in Dubai'
  return `Explore ${propertyName}${districtText}. Premium luxury property with exceptional amenities. Investment opportunity in Dubai's most prestigious location.`
}

// Обработать папку объекта
async function processPropertyFolder(folderPath: string): Promise<void> {
  const folderName = basename(folderPath)
  const { district, propertyName } = parseFolderName(folderName)
  
  const safeDistrict = district || 'Downtown'
  const safePropertyName = propertyName || folderName

  const images: Array<{ url: string; alt?: string; order: number; isMain: boolean }> = []
  const videos: Array<{ url: string; title: string; order: number }> = []
  const files: Array<{ url: string; label: string; filename: string; size: number; mimeType: string; order: number }> = []

  // Рекурсивно обработать все файлы
  async function processDirectory(dirPath: string) {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)

      if (entry.isDirectory()) {
        await processDirectory(fullPath)
      } else if (entry.isFile() && !entry.name.startsWith('.') && entry.name !== '.DS_Store') {
        const ext = extname(entry.name).toLowerCase()
        
        if (IMAGE_EXTENSIONS.includes(ext)) {
          const fileInfo = await processFile(fullPath, 'image')
          
          // Создать thumbnail (пропускаем если sharp недоступен)
          const sharpForThumb = await getSharp()
          if (sharpForThumb) {
            try {
              const thumbnailDir = join(process.cwd(), 'public', 'uploads', 'properties', 'images', 'thumbnails')
              if (!existsSync(thumbnailDir)) {
                await mkdir(thumbnailDir, { recursive: true })
              }
              const thumbnailFilename = `thumb-${fileInfo.filename}`
              const thumbnailPath = join(thumbnailDir, thumbnailFilename)
              const imagePath = join(process.cwd(), 'public', fileInfo.url)
              await sharpForThumb(imagePath)
                .resize(200, 200, {
                  fit: sharpForThumb.fit.inside,
                  withoutEnlargement: true,
                })
                .webp({ quality: 70 })
                .toFile(thumbnailPath)
            } catch (thumbErr) {
              console.warn('[import-folder] thumbnail creation failed:', thumbErr)
            }
          }
          
          images.push({
            url: fileInfo.url,
            alt: `${safePropertyName} - ${entry.name}`,
            order: images.length,
            isMain: images.length === 0,
          })
        } else if (VIDEO_EXTENSIONS.includes(ext)) {
          // Проверяем соотношение сторон
          const is16x9 = await isVideo16x9(fullPath)
          if (is16x9) {
            const fileInfo = await processFile(fullPath, 'video')
            videos.push({
              url: fileInfo.url,
              title: entry.name.replace(/\.[^/.]+$/, ''),
              order: videos.length,
            })
          }
        } else if (DOCUMENT_EXTENSIONS.includes(ext)) {
          const fileInfo = await processFile(fullPath, 'file')
          files.push({
            url: fileInfo.url,
            label: entry.name.replace(/\.[^/.]+$/, ''),
            filename: fileInfo.filename,
            size: fileInfo.size,
            mimeType: fileInfo.mimeType,
            order: files.length,
          })
        }
      }
    }
  }

  await processDirectory(folderPath)

  if (images.length === 0) {
    throw new Error(`No images found in folder: ${folderName}`)
  }

  // Генерировать SEO данные
  const slug = generateSlug(safePropertyName, safeDistrict)
  const uniqueSlug = await generateUniqueSlug(slug)
  const description = generateDescription(safePropertyName, safeDistrict)
  const metaTitle = generateMetaTitle(safePropertyName, safeDistrict)
  const metaDescription = generateMetaDescription(safePropertyName, safeDistrict)

  // Найти или создать район
  const districtSlug = safeDistrict.toLowerCase().replace(/\s+/g, '-')
  let area = await prisma.area.findFirst({
    where: {
      OR: [
        { name: { contains: safeDistrict, mode: 'insensitive' } },
        { nameEn: { contains: safeDistrict, mode: 'insensitive' } },
        { slug: districtSlug },
      ],
    },
  })

  if (!area) {
    area = await prisma.area.create({
      data: {
        name: district,
        nameEn: district,
        city: 'Dubai',
        slug: districtSlug,
      },
    })
  }

  // Создать объект недвижимости
  const property = await prisma.property.create({
    data: {
      title: safePropertyName,
      titleEn: safePropertyName,
      description,
      descriptionEn: description,
      price: 1000000,
      currency: 'AED',
      type: 'Apartment',
      areaSqm: 100,
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      address: `${safePropertyName}, ${safeDistrict}, Dubai`,
      city: 'Dubai',
      district: safeDistrict,
      areaId: area.id,
      slug: uniqueSlug,
      metaTitle,
      metaDescription,
      isPublished: true,
      isFeatured: false,
    },
  })

    // Добавить изображения
    if (images.length > 0) {
      await prisma.propertyImage.createMany({
        data: images.map(img => ({
          propertyId: property.id,
          url: img.url,
          alt: img.alt || '',
          order: img.order,
          isMain: img.isMain,
        })),
      })
    }

  // Добавить видео (как изображения для отображения в галерее)
  if (videos.length > 0) {
    await prisma.propertyImage.createMany({
      data: videos.map(video => ({
        propertyId: property.id,
        url: video.url,
        alt: video.title,
        order: images.length + video.order,
        isMain: false,
      })),
    })
  }

  // Добавить документы
  if (files.length > 0) {
    await prisma.propertyFile.createMany({
      data: files.map(file => ({
        propertyId: property.id,
        url: file.url,
        label: file.label,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimeType,
        order: file.order,
      })),
    })
  }
}

// Генерировать уникальный slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const existing = await prisma.property.findUnique({
      where: { slug },
    })
    
    if (!existing) {
      return slug
    }
    
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ message: 'Database not configured' })
  }

  try {
    const body = req.body as { folderPath?: string } | undefined
    const folderPath = body?.folderPath

    if (!folderPath || typeof folderPath !== 'string') {
      return res.status(400).json({ message: 'Folder path is required' })
    }

    if (!existsSync(folderPath)) {
      return res.status(400).json({ message: 'Folder does not exist' })
    }

    const stats = await stat(folderPath)
    if (!stats.isDirectory()) {
      return res.status(400).json({ message: 'Path is not a directory' })
    }

    // Проверяем: подпапки объектов ИЛИ сама папка - один объект (файлы внутри)
    const entries = await readdir(folderPath, { withFileTypes: true })
    const subdirs = entries.filter(entry => entry.isDirectory())
    const hasFiles = entries.some(entry => entry.isFile() && !entry.name.startsWith('.'))

    const foldersToProcess: { path: string; name: string }[] = []
    if (subdirs.length > 0) {
      foldersToProcess.push(...subdirs.map(d => ({ path: join(folderPath, d.name), name: d.name })))
    } else if (hasFiles) {
      // Single property folder - files directly in folderPath
      foldersToProcess.push({ path: folderPath, name: basename(folderPath) })
    }

    if (foldersToProcess.length === 0) {
      return res.status(400).json({ message: 'No property folders or files found in directory' })
    }

    const results = {
      success: [] as string[],
      errors: [] as string[],
    }

    for (const { path: propertyFolderPath, name: folderName } of foldersToProcess) {
      try {
        await processPropertyFolder(propertyFolderPath)
        results.success.push(folderName)
      } catch (error: any) {
        results.errors.push(`${folderName}: ${error.message}`)
      }
    }

    return res.status(200).json({
      message: 'Import completed',
      results,
      total: foldersToProcess.length,
      successful: results.success.length,
      failed: results.errors.length,
    })
  } catch (error: any) {
    console.error('Error importing properties:', error)
    return res.status(500).json({
      message: 'Error importing properties',
      error: error.message,
    })
  }
}

