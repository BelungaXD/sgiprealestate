import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { readdir, stat, copyFile, mkdir, rm, readFile, writeFile } from 'fs/promises'
import { join, extname, basename, resolve, relative, sep } from 'path'
import { existsSync } from 'fs'
import { writePropertyListingThumbnail } from '@/lib/propertyThumbnails'
import { createScopedLogger } from '@/lib/logger'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
const LOG_SCOPE = 'import-folder'
const FFPROBE_TIMEOUT_MS = 15000
const PROPERTY_LINK_FILE = '.sgip-property-link.json'
const baseLog = createScopedLogger(`api/properties/${LOG_SCOPE}`)

/** Avoid `which ffprobe` on every video (was slowing batch imports). */
let ffprobeResolved: string | false | undefined
async function resolveFfprobePath(): Promise<string | false> {
  if (ffprobeResolved !== undefined) return ffprobeResolved
  try {
    const { stdout } = await execAsync('which ffprobe')
    const p = stdout.trim().split('\n')[0]?.trim()
    ffprobeResolved = p || false
  } catch {
    ffprobeResolved = false
    baseLog.warn('ffprobe not found; video aspect ratio checks skipped')
  }
  return ffprobeResolved
}

function log(message: string, details?: Record<string, unknown>) {
  baseLog.info(message, details)
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown error'
}

function resolvePublicAssetPath(assetUrl: string): string {
  return join(process.cwd(), 'public', assetUrl.replace(/^\/+/, ''))
}

async function saveFolderPropertyLink(folderPath: string, propertyId: string): Promise<void> {
  const markerPath = join(folderPath, PROPERTY_LINK_FILE)
  try {
    let existingIds: string[] = []
    try {
      const raw = await readFile(markerPath, 'utf8')
      const parsed = JSON.parse(raw) as { propertyId?: string; propertyIds?: unknown }
      const ids = new Set<string>()
      if (typeof parsed.propertyId === 'string' && parsed.propertyId.trim()) ids.add(parsed.propertyId.trim())
      if (Array.isArray(parsed.propertyIds)) {
        for (const id of parsed.propertyIds) {
          if (typeof id === 'string' && id.trim()) ids.add(id.trim())
        }
      }
      existingIds = Array.from(ids)
    } catch {
      existingIds = []
    }
    const nextIds = Array.from(new Set([...existingIds, propertyId]))
    await writeFile(
      markerPath,
      JSON.stringify(
        {
          source: 'import-folder',
          updatedAt: new Date().toISOString(),
          propertyIds: nextIds,
          propertyId: nextIds[0] || propertyId,
        },
        null,
        2
      )
    )
  } catch (e) {
    baseLog.warn('failed to write folder-property link', {
      folderPath,
      propertyId,
      error: e,
    })
  }
}

/** Staging root from upload-folder-stream: public/uploads/incoming/{uploadId}/ */
const INCOMING_STAGING_ROOT = resolve(join(process.cwd(), 'public', 'uploads', 'incoming'))

function isIncomingBatchDir(dir: string): boolean {
  const abs = resolve(dir)
  const rel = relative(INCOMING_STAGING_ROOT, abs)
  if (rel.startsWith('..')) return false
  if (rel === '') return false
  return abs.startsWith(INCOMING_STAGING_ROOT + sep)
}

/** Drop browser-upload staging after import; never touch paths outside incoming or the incoming root itself. */
async function removeIncomingStagingDirIfApplicable(folderPath: string): Promise<void> {
  if (!isIncomingBatchDir(folderPath)) return
  try {
    await rm(resolve(folderPath), { recursive: true, force: true })
    log('incoming staging removed', { folderPath: resolve(folderPath) })
  } catch (e) {
    baseLog.warn('incoming staging remove failed', {
      folderPath,
      error: e,
    })
  }
}

// Lazy-load sharp to avoid import-time failure (e.g. linux-x64 runtime error in Docker)
let sharpModule: typeof import('sharp') | null | false = null
async function getSharp(): Promise<typeof import('sharp') | null> {
  if (sharpModule === false) return null
  if (sharpModule) return sharpModule
  try {
    sharpModule = (await import('sharp')).default
    return sharpModule
  } catch (err) {
    baseLog.warn('sharp failed to load', {
      error: err instanceof Error ? err.message : String(err),
    })
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
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.heic', '.heif', '.avif', '.tiff', '.tif']
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.mpg', '.mpeg', '.3gp', '.wmv']
/** Allowed property documents under uploads/properties/files. */
const PROPERTY_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']

// Получить MIME type
function getMimeType(filepath: string): string {
  const ext = extname(filepath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.avif': 'image/avif',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.m4v': 'video/x-m4v',
    '.mpg': 'video/mpeg',
    '.mpeg': 'video/mpeg',
    '.3gp': 'video/3gpp',
    '.wmv': 'video/x-ms-wmv',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',
    '.csv': 'text/csv',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

function isVisibleFile(entryName: string): boolean {
  return !entryName.startsWith('.') && entryName !== '.DS_Store'
}

async function hasVisibleFilesRecursive(dirPath: string): Promise<boolean> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isFile() && isVisibleFile(entry.name)) {
      return true
    }
    if (entry.isDirectory()) {
      const hasFiles = await hasVisibleFilesRecursive(fullPath)
      if (hasFiles) return true
    }
  }
  return false
}

// Проверить соотношение сторон видео (16:9)
async function isVideo16x9(videoPath: string): Promise<boolean> {
  try {
    const ffprobeBin = await resolveFfprobePath()
    if (!ffprobeBin) {
      return true
    }

    const startedAt = Date.now()
    const { stdout } = await execAsync(
      `"${ffprobeBin}" -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`,
      { timeout: FFPROBE_TIMEOUT_MS }
    )
    const [width, height] = stdout.trim().split('x').map(Number)
    if (!width || !height) return false
    
    const ratio = width / height
    // Проверяем, что соотношение близко к 16:9 (1.777...)
    const isValid = Math.abs(ratio - 16 / 9) < 0.1
    log('ffprobe completed', {
      file: videoPath,
      width,
      height,
      ratio,
      isValid,
      durationMs: Date.now() - startedAt,
    })
    return isValid
  } catch (error) {
    baseLog.error('Error checking video aspect ratio', {
      file: videoPath,
      error,
    })
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
      baseLog.warn('sharp error, copying image as-is', {
        error: err instanceof Error ? err.message : String(err),
        sourcePath,
      })
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
async function processPropertyFolder(folderPath: string): Promise<{ id: string; title: string }> {
  const folderName = basename(folderPath)
  const { district, propertyName } = parseFolderName(folderName)
  
  const safeDistrict = district || 'Downtown'
  const safePropertyName = propertyName || folderName

  const images: Array<{ url: string; alt?: string; order: number; isMain: boolean }> = []
  const videos: Array<{ url: string; title: string; order: number }> = []
  const files: Array<{ url: string; label: string; filename: string; size: number; mimeType: string; order: number }> = []

  const folderStartedAt = Date.now()
  let visibleFilesProcessed = 0

  // Рекурсивно обработать все файлы
  async function processDirectory(dirPath: string) {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)

      if (entry.isDirectory()) {
        await processDirectory(fullPath)
      } else if (entry.isFile() && isVisibleFile(entry.name)) {
        const ext = extname(entry.name).toLowerCase()
        
        if (IMAGE_EXTENSIONS.includes(ext)) {
          const fileInfo = await processFile(fullPath, 'image')
          
          try {
            const thumbnailDir = join(process.cwd(), 'public', 'uploads', 'properties', 'images', 'thumbnails')
            if (!existsSync(thumbnailDir)) {
              await mkdir(thumbnailDir, { recursive: true })
            }
            const thumbnailPath = join(thumbnailDir, fileInfo.filename)
            const imagePath = resolvePublicAssetPath(fileInfo.url)
            await writePropertyListingThumbnail(imagePath, thumbnailPath)
          } catch (thumbErr) {
            baseLog.warn('thumbnail creation failed', {
              error: thumbErr instanceof Error ? thumbErr.message : String(thumbErr),
              imagePath,
            })
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
        } else if (PROPERTY_FILE_EXTENSIONS.includes(ext)) {
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

        visibleFilesProcessed++
        if (visibleFilesProcessed % 5 === 0) {
          log('folder file progress', {
            folder: folderName,
            filesDone: visibleFilesProcessed,
            elapsedMs: Date.now() - folderStartedAt,
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
    const areaName = String(safeDistrict || 'Downtown')
    area = await prisma.area.create({
      data: {
        name: areaName,
        nameEn: areaName,
        city: 'Dubai',
        slug: districtSlug,
      },
    })
  }

  // Создать объект недвижимости (Property schema: title, description, type, features[], amenities[])
  const property = await prisma.property.create({
    data: {
      title: safePropertyName,
      description,
      price: 1000000,
      currency: 'AED',
      type: 'APARTMENT',
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
      features: [],
      amenities: [],
      isPublished: true,
      isFeatured: false,
    },
    select: { id: true },
  })
  await saveFolderPropertyLink(folderPath, property.id)

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
  return { id: property.id, title: safePropertyName }
}

// Генерировать уникальный slug
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.property.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Process a single folder and attach images/videos/files to an existing property.
 * Does not create a new property or update property fields.
 */
async function processFolderIntoProperty(propertyId: string, folderPath: string): Promise<void> {
  const folderName = basename(folderPath)
  const images: Array<{ url: string; alt?: string; order: number; isMain: boolean }> = []
  const videos: Array<{ url: string; title: string; order: number }> = []
  const files: Array<{ url: string; label: string; filename: string; size: number; mimeType: string; order: number }> = []

  const folderStartedAt = Date.now()
  let visibleFilesProcessed = 0

  async function processDirectory(dirPath: string) {
    const entries = await readdir(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        await processDirectory(fullPath)
      } else if (entry.isFile() && isVisibleFile(entry.name)) {
        const ext = extname(entry.name).toLowerCase()
        if (IMAGE_EXTENSIONS.includes(ext)) {
          const fileInfo = await processFile(fullPath, 'image')
          try {
            const thumbnailDir = join(process.cwd(), 'public', 'uploads', 'properties', 'images', 'thumbnails')
            if (!existsSync(thumbnailDir)) await mkdir(thumbnailDir, { recursive: true })
            const thumbnailPath = join(thumbnailDir, fileInfo.filename)
            const imagePath = resolvePublicAssetPath(fileInfo.url)
            await writePropertyListingThumbnail(imagePath, thumbnailPath)
          } catch (thumbErr) {
            baseLog.warn('thumbnail creation failed', {
              error: thumbErr instanceof Error ? thumbErr.message : String(thumbErr),
              imagePath,
            })
          }
          images.push({
            url: fileInfo.url,
            alt: `${folderName} - ${entry.name}`,
            order: images.length,
            isMain: images.length === 0,
          })
        } else if (VIDEO_EXTENSIONS.includes(ext)) {
          const is16x9 = await isVideo16x9(fullPath)
          if (is16x9) {
            const fileInfo = await processFile(fullPath, 'video')
            videos.push({
              url: fileInfo.url,
              title: entry.name.replace(/\.[^/.]+$/, ''),
              order: videos.length,
            })
          }
        } else if (PROPERTY_FILE_EXTENSIONS.includes(ext)) {
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

        visibleFilesProcessed++
        if (visibleFilesProcessed % 5 === 0) {
          log('attach folder file progress', {
            propertyId,
            folder: folderName,
            filesDone: visibleFilesProcessed,
            elapsedMs: Date.now() - folderStartedAt,
          })
        }
      }
    }
  }

  await processDirectory(folderPath)
  if (images.length === 0 && videos.length === 0 && files.length === 0) {
    throw new Error(`No images, videos or documents found in folder: ${folderName}`)
  }

  if (images.length > 0) {
    await prisma.propertyImage.createMany({
      data: images.map(img => ({
        propertyId,
        url: img.url,
        alt: img.alt || '',
        order: img.order,
        isMain: img.isMain,
      })),
    })
  }
  if (videos.length > 0) {
    await prisma.propertyImage.createMany({
      data: videos.map(video => ({
        propertyId,
        url: video.url,
        alt: video.title,
        order: images.length + video.order,
        isMain: false,
      })),
    })
  }
  if (files.length > 0) {
    await prisma.propertyFile.createMany({
      data: files.map(file => ({
        propertyId,
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
    const startedAt = Date.now()
    const body = req.body as { folderPath?: string; propertyId?: string } | undefined
    const folderPath = body?.folderPath
    const propertyId = body?.propertyId
    log('request started', {
      folderPath,
      propertyId: typeof propertyId === 'string' ? propertyId : undefined,
    })

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

    // Attach folder to existing property (import one folder into one property)
    if (propertyId && typeof propertyId === 'string') {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, title: true },
      })
      if (!property) {
        return res.status(404).json({ message: 'Property not found' })
      }
      const hasAnyFiles = await hasVisibleFilesRecursive(folderPath)
      if (!hasAnyFiles) {
        return res.status(400).json({ message: 'Choose a folder that contains at least one file in any nested level' })
      }
      log('attaching folder into existing property', { propertyId, sourceFolder: folderPath })
      await processFolderIntoProperty(propertyId, folderPath)
      log('attach completed', { propertyId, sourceFolder: folderPath, durationMs: Date.now() - startedAt })
      await removeIncomingStagingDirIfApplicable(folderPath)
      return res.status(200).json({
        message: 'Folder imported into property',
        results: { success: [property.title], errors: [] },
        total: 1,
        successful: 1,
        failed: 0,
        createdPropertyIds: [property.id],
      })
    }

    // Create new property(ies) from folder(s)
    const entries = await readdir(folderPath, { withFileTypes: true })
    const subdirs = entries.filter(entry => entry.isDirectory())
    const hasFiles = entries.some(entry => entry.isFile() && !entry.name.startsWith('.'))

    const foldersToProcess: { path: string; name: string }[] = []
    
    // Если есть подпапки, проверяем их содержимое
    if (subdirs.length > 0) {
      // Проверяем, есть ли в подпапках файлы (категории) или это подпапки объектов недвижимости
      let hasPropertySubfolders = false
      for (const subdir of subdirs) {
        const subdirPath = join(folderPath, subdir.name)
        const subdirEntries = await readdir(subdirPath, { withFileTypes: true })
        const subdirHasFiles = subdirEntries.some(entry => entry.isFile() && !entry.name.startsWith('.'))
        const subdirHasSubdirs = subdirEntries.some(entry => entry.isDirectory())
        
        // Если в подпапке есть файлы, это категория (IMAGES, FLOOR PLAN и т.д.)
        // Если в подпапке только подпапки, это может быть объект недвижимости
        if (subdirHasFiles && !subdirHasSubdirs) {
          // Это категория файлов - обрабатываем всю папку как одну недвижимость
          hasPropertySubfolders = false
          break
        } else if (subdirHasSubdirs) {
          // Это может быть объект недвижимости
          hasPropertySubfolders = true
        }
      }
      
      if (hasPropertySubfolders) {
        // Подпапки - это объекты недвижимости
        foldersToProcess.push(...subdirs.map(d => ({ path: join(folderPath, d.name), name: d.name })))
      } else {
        // Подпапки - это категории файлов, обрабатываем всю папку как одну недвижимость
        foldersToProcess.push({ path: folderPath, name: basename(folderPath) })
      }
    } else if (hasFiles) {
      foldersToProcess.push({ path: folderPath, name: basename(folderPath) })
    }

    if (foldersToProcess.length === 0) {
      return res.status(400).json({ message: 'No property folders or files found in directory' })
    }

    log('folders resolved', {
      sourceFolder: folderPath,
      foldersToProcess: foldersToProcess.map((folder) => folder.path),
    })
    const results = { success: [] as string[], errors: [] as string[] }
    const createdPropertyIds: string[] = []
    for (const { path: propertyFolderPath, name: folderName } of foldersToProcess) {
      try {
        const folderStartedAt = Date.now()
        log('folder processing started', { folderName, propertyFolderPath })
        const createdProperty = await processPropertyFolder(propertyFolderPath)
        createdPropertyIds.push(createdProperty.id)
        results.success.push(folderName)
        log('folder processing completed', {
          folderName,
          propertyFolderPath,
          durationMs: Date.now() - folderStartedAt,
        })
      } catch (error: unknown) {
        const message = errorMessage(error)
        baseLog.error('folder processing failed', {
          folderName,
          propertyFolderPath,
          error: message,
        })
        results.errors.push(`${folderName}: ${message}`)
      }
    }

    log('request completed', {
      sourceFolder: folderPath,
      total: foldersToProcess.length,
      successful: results.success.length,
      failed: results.errors.length,
      durationMs: Date.now() - startedAt,
    })
    if (results.errors.length === 0) {
      await removeIncomingStagingDirIfApplicable(folderPath)
    }
    return res.status(200).json({
      message: 'Import completed',
      results,
      total: foldersToProcess.length,
      successful: results.success.length,
      failed: results.errors.length,
      createdPropertyIds,
    })
  } catch (error: unknown) {
    const message = errorMessage(error)
    baseLog.error('Error importing properties', { error: message })
    return res.status(500).json({
      message: 'Error importing properties',
      error: message,
    })
  }
}

