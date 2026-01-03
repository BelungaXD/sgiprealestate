import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname, basename, dirname } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'
import { promisify } from 'util'
import { exec } from 'child_process'
import formidable, { File } from 'formidable'
import fs from 'fs'

const execAsync = promisify(exec)

export const config = {
  api: {
    bodyParser: false,
    // Увеличиваем таймаут для больших импортов (работает в Vercel Pro и self-hosted)
    maxDuration: 300, // 5 минут
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
    try {
      await execAsync('which ffprobe')
    } catch {
      console.warn('ffprobe not found, accepting all videos')
      return true
    }
    
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`
    )
    const [width, height] = stdout.trim().split('x').map(Number)
    if (!width || !height) return false
    
    const ratio = width / height
    return Math.abs(ratio - 16/9) < 0.1
  } catch (error) {
    console.error('Error checking video aspect ratio:', error)
    return true
  }
}

// Конвертировать изображение в WebP
async function convertToWebP(sourcePath: string, destPath: string): Promise<void> {
  await sharp(sourcePath)
    .webp({ quality: 85 })
    .toFile(destPath)
}

// Сохранить файл
async function saveFile(
  file: File,
  category: 'image' | 'video' | 'file'
): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
  const originalFilename = file.originalFilename || file.newFilename
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
    
    const ext = extname(originalFilename).toLowerCase()
    const nameWithoutExt = basename(originalFilename, ext)
    uniqueFilename = `${timestamp}-${nameWithoutExt}.webp`
    finalPath = join(destDir, uniqueFilename)
    
    if (ext === '.webp') {
      await fs.promises.copyFile(file.filepath, finalPath)
    } else {
      await convertToWebP(file.filepath, finalPath)
    }
  } else if (category === 'video') {
    destDir = join(process.cwd(), 'public', 'uploads', 'properties', 'videos')
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true })
    }
    uniqueFilename = `${timestamp}-${sanitizedFilename}`
    finalPath = join(destDir, uniqueFilename)
    await fs.promises.copyFile(file.filepath, finalPath)
  } else {
    destDir = join(process.cwd(), 'public', 'uploads', 'properties', 'files')
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true })
    }
    uniqueFilename = `${timestamp}-${sanitizedFilename}`
    finalPath = join(destDir, uniqueFilename)
    await fs.promises.copyFile(file.filepath, finalPath)
  }

  const stats = await fs.promises.stat(finalPath)
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
    
    if (VALID_DISTRICTS.includes(district)) {
      return { district, propertyName }
    }
  }
  
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

// Обработать файлы для одного объекта
async function processPropertyFiles(
  files: File[],
  folderName: string
): Promise<void> {
  const { district, propertyName } = parseFolderName(folderName)
  
  // Если район не найден в названии папки, пытаемся найти его в пути файлов
  let finalDistrict = district
  let finalPropertyName = propertyName
  
  if (!district) {
    // Пытаемся найти район в путях файлов
    for (const file of files) {
      const relativePath = file.originalFilename || ''
      const parts = relativePath.split('/')
      
      // Ищем папку с районом в пути
      for (const part of parts) {
        if (VALID_DISTRICTS.includes(part)) {
          finalDistrict = part
          // Используем название папки объекта как название недвижимости
          finalPropertyName = folderName
          break
        }
      }
      
      if (finalDistrict) break
    }
    
    // Если район все еще не найден, используем название папки как есть
    if (!finalDistrict) {
      finalDistrict = 'Downtown' // Дефолтный район
      finalPropertyName = folderName
      console.warn(`District not found for folder ${folderName}, using default: Downtown`)
    }
  }

  const images: Array<{ url: string; alt?: string; order: number; isMain: boolean }> = []
  const videos: Array<{ url: string; title: string; order: number }> = []
  const filesList: Array<{ url: string; label: string; filename: string; size: number; mimeType: string; order: number }> = []

  // Обработать все файлы
  for (const file of files) {
    const relativePath = file.originalFilename || ''
    const fileName = basename(relativePath)
    
    if (fileName.startsWith('.') || fileName === '.DS_Store') {
      continue
    }

    const ext = extname(fileName).toLowerCase()
    
    try {
      if (IMAGE_EXTENSIONS.includes(ext)) {
        const fileInfo = await saveFile(file, 'image')
        
        // Создать thumbnail
        const thumbnailDir = join(process.cwd(), 'public', 'uploads', 'properties', 'images', 'thumbnails')
        if (!existsSync(thumbnailDir)) {
          await mkdir(thumbnailDir, { recursive: true })
        }
        const thumbnailFilename = `thumb-${fileInfo.filename}`
        const thumbnailPath = join(thumbnailDir, thumbnailFilename)
        
        const imagePath = join(process.cwd(), 'public', fileInfo.url)
        await sharp(imagePath)
          .resize(200, 200, {
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          })
          .webp({ quality: 70 })
          .toFile(thumbnailPath)
        
        images.push({
          url: fileInfo.url,
          alt: `${finalPropertyName} - ${fileName}`,
          order: images.length,
          isMain: images.length === 0,
        })
      } else if (VIDEO_EXTENSIONS.includes(ext)) {
        // Сохраняем временно для проверки
        const tempPath = file.filepath
        const is16x9 = await isVideo16x9(tempPath)
        
        if (is16x9) {
          const fileInfo = await saveFile(file, 'video')
          videos.push({
            url: fileInfo.url,
            title: fileName.replace(/\.[^/.]+$/, ''),
            order: videos.length,
          })
        }
      } else if (DOCUMENT_EXTENSIONS.includes(ext)) {
        const fileInfo = await saveFile(file, 'file')
      filesList.push({
        url: fileInfo.url,
        label: fileName.replace(/\.[^/.]+$/, ''),
        filename: fileInfo.filename,
        size: fileInfo.size,
        mimeType: fileInfo.mimeType,
        order: filesList.length,
      })
      }
    } catch (fileError: any) {
      // Продолжаем обработку других файлов
    }
  }

  // Пропускаем папки без медиа и документов (возможно, это просто папка района, а не объекта)
  if (images.length === 0 && videos.length === 0 && filesList.length === 0) {
    return // Не создаем объект, если нет медиа или документов
  }

  // Генерировать SEO данные
  // finalDistrict гарантированно не null здесь (есть дефолт 'Downtown')
  const district = finalDistrict || 'Downtown'
  const slug = generateSlug(finalPropertyName, district)
  const uniqueSlug = await generateUniqueSlug(slug)
  const description = generateDescription(finalPropertyName, district)
  const metaTitle = generateMetaTitle(finalPropertyName, district)
  const metaDescription = generateMetaDescription(finalPropertyName, district)

  // Найти или создать район
  const districtSlug = district.toLowerCase().replace(/\s+/g, '-')
  let area = await prisma.area.findFirst({
    where: {
      OR: [
        { name: { contains: district, mode: 'insensitive' } },
        { nameEn: { contains: district, mode: 'insensitive' } },
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
      title: finalPropertyName,
      description,
      price: 1000000,
      currency: 'AED',
      type: 'APARTMENT',
      areaSqm: 100,
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      address: `${finalPropertyName}, ${district}, Dubai`,
      city: 'Dubai',
      district: district,
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
  if (filesList.length > 0) {
    await prisma.propertyFile.createMany({
      data: filesList.map(file => ({
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
    // Парсим FormData
    const form = formidable({
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB per file
      maxTotalFileSize: 10 * 1024 * 1024 * 1024, // 10GB total
      keepExtensions: true,
      multiples: true,
    })

    const [fields, files] = await form.parse(req)
    
    // Обрабатываем файлы - может быть массив или один файл
    let fileArray: File[] = []
    if (files.files) {
      if (Array.isArray(files.files)) {
        fileArray = files.files
      } else {
        fileArray = [files.files]
      }
    }
    
    if (fileArray.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    // Логируем первые несколько файлов для отладки
    if (fileArray.length > 0) {
      console.log('[IMPORT] Sample files:', fileArray.slice(0, 3).map(f => ({
        originalFilename: f.originalFilename,
        size: f.size,
        mimetype: f.mimetype,
      })))
    }

    // Группируем файлы по папкам объектов (формат: "РАЙОН - НАЗВАНИЕ")
    // Ищем папки с таким форматом на любом уровне вложенности
    console.log('[IMPORT] Grouping files by folders...')
    const filesByFolder = new Map<string, File[]>()
    
    for (const file of fileArray) {
      // Получаем относительный путь из originalFilename
      // Формат может быть: "Emaar Properties/Beachfront/Beachfront - Beach Maison/file.jpg"
      const relativePath = file.originalFilename || file.newFilename || ''
      
      // Ищем папку в формате "РАЙОН - НАЗВАНИЕ" в пути
      const parts = relativePath.split('/')
      let propertyFolderName: string | null = null
      
      // Проходим по всем частям пути и ищем папку с форматом "РАЙОН - НАЗВАНИЕ"
      for (const part of parts) {
        if (part.includes(' - ')) {
          const { district } = parseFolderName(part)
          // Проверяем, что это валидный район
          if (district && VALID_DISTRICTS.includes(district)) {
            propertyFolderName = part
            break
          }
        }
      }
      
      // Если не нашли папку объекта, используем последнюю папку в пути
      // Но только если это не просто название района
      if (!propertyFolderName) {
        // Пропускаем файлы в корне или без папки
        if (parts.length <= 1) {
          continue
        }
        
        // Проверяем, не является ли последняя папка просто названием района
        const lastFolder = parts[parts.length - 2]
        if (lastFolder && VALID_DISTRICTS.includes(lastFolder)) {
          // Это папка района, пропускаем
          continue
        }
        
        // Используем последнюю папку как имя объекта
        propertyFolderName = lastFolder || 'Unknown'
      }
      
      if (!filesByFolder.has(propertyFolderName)) {
        filesByFolder.set(propertyFolderName, [])
      }
      filesByFolder.get(propertyFolderName)!.push(file)
    }

    console.log(`[IMPORT] Files grouped into ${filesByFolder.size} folders:`, Array.from(filesByFolder.keys()))

    const results = {
      success: [] as string[],
      errors: [] as string[],
    }

    // Обработать каждую папку объекта
    let processedFolders = 0
    const totalFolders = filesByFolder.size
    
    for (const [folderName, folderFiles] of filesByFolder.entries()) {
      processedFolders++
      try {
        console.log(`[IMPORT] [${processedFolders}/${totalFolders}] Processing folder: ${folderName} with ${folderFiles.length} files`)
        const startTime = Date.now()
        
        await processPropertyFiles(folderFiles, folderName)
        
        const duration = Date.now() - startTime
        results.success.push(folderName)
        console.log(`[IMPORT] ✓ Successfully processed folder: ${folderName} (${duration}ms)`)
      } catch (error: any) {
        console.error(`[IMPORT] ✗ Error processing folder ${folderName}:`, error)
        console.error(`[IMPORT] Error stack:`, error.stack)
        results.errors.push(`${folderName}: ${error.message}`)
        // Продолжаем обработку других папок даже при ошибке
      }
    }
    
    console.log(`[IMPORT] Import completed. Success: ${results.success.length}, Errors: ${results.errors.length}`)

    return res.status(200).json({
      message: 'Import completed',
      results,
      total: filesByFolder.size,
      successful: results.success.length,
      failed: results.errors.length,
    })
  } catch (error: any) {
    console.error('Error importing properties:', error)
    console.error('Error stack:', error.stack)
    
    // Более детальное сообщение об ошибке
    let errorMessage = error.message || 'Unknown error'
    if (error.message?.includes('maxTotalFileSize')) {
      errorMessage = 'Размер файлов слишком большой. Попробуйте загрузить папки по отдельности или уменьшите размер файлов.'
    } else if (error.message?.includes('maxFileSize')) {
      errorMessage = 'Один из файлов слишком большой. Максимальный размер файла: 2GB.'
    }
    
    return res.status(500).json({
      message: 'Error importing properties',
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
}

