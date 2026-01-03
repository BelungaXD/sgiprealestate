import { PrismaClient } from '@prisma/client'
import { readdir, stat, copyFile, mkdir } from 'fs/promises'
import { join, extname, basename, dirname } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()

// Language detection patterns
const LANGUAGE_PATTERNS: Record<string, string> = {
  'EN_': 'eng',
  'RU_': 'ru',
  'AR_': 'ar',
  'CN_': 'cn',
  '_EN': 'eng',
  '_RU': 'ru',
  '_AR': 'ar',
  '_CN': 'cn',
}

// Image extensions (for viewing in browser)
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg']

// Video extensions (for viewing in browser)
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv']

// Get language from filename
function getLanguageFromFilename(filename: string): string | null {
  const upperFilename = filename.toUpperCase()
  for (const [pattern, lang] of Object.entries(LANGUAGE_PATTERNS)) {
    if (upperFilename.includes(pattern)) {
      return lang
    }
  }
  return null
}

// Add language suffix to filename
function addLanguageSuffix(filename: string, language: string | null): string {
  if (!language) return filename
  
  const ext = extname(filename)
  const nameWithoutExt = basename(filename, ext)
  return `${nameWithoutExt}_${language}${ext}`
}

// Get MIME type from extension
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

// Determine file category
function getFileCategory(filepath: string): 'image' | 'video' | 'file' {
  const ext = extname(filepath).toLowerCase()
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  return 'file'
}

// Copy file to destination
async function copyFileToDestination(
  sourcePath: string,
  category: 'image' | 'video' | 'file',
  language: string | null
): Promise<{ url: string; filename: string; size: number; mimeType: string }> {
  const originalFilename = basename(sourcePath)
  const filenameWithLang = addLanguageSuffix(originalFilename, language)
  const timestamp = Date.now()
  const sanitizedFilename = filenameWithLang.replace(/[^a-zA-Z0-9._-]/g, '_')
  const uniqueFilename = `${timestamp}-${sanitizedFilename}`

  let destDir: string
  if (category === 'image') {
    destDir = join(process.cwd(), 'public', 'uploads', 'properties', 'images')
  } else if (category === 'video') {
    destDir = join(process.cwd(), 'public', 'uploads', 'properties', 'videos')
  } else {
    destDir = join(process.cwd(), 'public', 'uploads', 'properties', 'files')
  }

  if (!existsSync(destDir)) {
    await mkdir(destDir, { recursive: true })
  }

  const destPath = join(destDir, uniqueFilename)
  await copyFile(sourcePath, destPath)

  const stats = await stat(destPath)
  const url = category === 'image'
    ? `/uploads/properties/images/${uniqueFilename}`
    : category === 'video'
    ? `/uploads/properties/videos/${uniqueFilename}`
    : `/uploads/properties/files/${uniqueFilename}`

  return {
    url,
    filename: uniqueFilename,
    size: stats.size,
    mimeType: getMimeType(sourcePath),
  }
}

// Process folder structure
async function processPropertyFolder(
  propertyFolderPath: string,
  propertyName: string,
  areaId: string
): Promise<void> {
  console.log(`\nProcessing property: ${propertyName}`)

  const images: Array<{ url: string; alt?: string; order: number; isMain: boolean }> = []
  const videos: Array<{ url: string; title: string; order: number }> = []
  const files: Array<{ url: string; label: string; filename: string; size: number; mimeType: string; order: number }> = []

  // Get folder name to determine category
  const folderName = basename(propertyFolderPath)
  const parentFolder = basename(dirname(propertyFolderPath))

  async function processDirectory(dirPath: string, categoryLabel: string = '') {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Process subdirectory
        await processDirectory(fullPath, entry.name)
      } else if (entry.isFile()) {
        const fileCategory = getFileCategory(fullPath)
        const language = getLanguageFromFilename(entry.name)
        const fileInfo = await copyFileToDestination(fullPath, fileCategory, language)

        if (fileCategory === 'image') {
          images.push({
            url: fileInfo.url,
            alt: `${propertyName} - ${entry.name}`,
            order: images.length,
            isMain: images.length === 0, // First image is main
          })
        } else if (fileCategory === 'video') {
          videos.push({
            url: fileInfo.url,
            title: entry.name.replace(/\.[^/.]+$/, ''),
            order: videos.length,
          })
        } else {
          // Determine label from folder name or filename
          let label = categoryLabel || entry.name.replace(/\.[^/.]+$/, '')
          if (language) {
            label = `${label} (${language.toUpperCase()})`
          }

          files.push({
            url: fileInfo.url,
            label,
            filename: fileInfo.filename,
            size: fileInfo.size,
            mimeType: fileInfo.mimeType,
            order: files.length,
          })
        }
      }
    }
  }

  await processDirectory(propertyFolderPath)

  // Generate slug from property name
  const slug = propertyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Create property in database
  try {
    // Check if property already exists
    const existingProperty = await prisma.property.findUnique({
      where: { slug },
    })

    if (existingProperty) {
      console.log(`  Property ${propertyName} already exists, skipping...`)
      return
    }

    // Extract property type from name (default to APARTMENT)
    let propertyType = 'APARTMENT'
    const nameUpper = propertyName.toUpperCase()
    if (nameUpper.includes('VILLA')) propertyType = 'VILLA'
    else if (nameUpper.includes('TOWNHOUSE')) propertyType = 'TOWNHOUSE'
    else if (nameUpper.includes('PENTHOUSE')) propertyType = 'PENTHOUSE'
    else if (nameUpper.includes('STUDIO')) propertyType = 'STUDIO'
    else if (nameUpper.includes('OFFICE')) propertyType = 'OFFICE'

    // Create property
    const property = await prisma.property.create({
      data: {
        title: propertyName,
        description: `Luxury property in Downtown Dubai: ${propertyName}`,
        type: propertyType as any,
        price: 0, // Will need to be updated manually
        currency: 'AED',
        status: 'AVAILABLE',
        areaSqm: 0, // Will need to be updated manually
        bedrooms: 0, // Will need to be updated manually
        bathrooms: 0, // Will need to be updated manually
        address: 'Downtown Dubai',
        city: 'Dubai',
        district: 'Downtown',
        areaId,
        slug,
        isPublished: false, // Set to false initially, need to fill in details
        isFeatured: false,
      },
    })

    console.log(`  ✓ Created property: ${property.id}`)

    // Add images
    if (images.length > 0) {
      await prisma.propertyImage.createMany({
        data: images.map(img => ({
          propertyId: property.id,
          url: img.url,
          alt: img.alt || null,
          order: img.order,
          isMain: img.isMain,
        })),
      })
      console.log(`  ✓ Added ${images.length} images`)
    }

    // Add videos (as floor plans or files)
    // Note: Schema doesn't have videos table, so we'll add them as files
    if (videos.length > 0) {
      await prisma.propertyFile.createMany({
        data: videos.map(video => ({
          propertyId: property.id,
          url: video.url,
          label: `Video: ${video.title}`,
          filename: video.url.split('/').pop() || 'video',
          size: null,
          mimeType: 'video/mp4',
          order: videos.indexOf(video),
        })),
      })
      console.log(`  ✓ Added ${videos.length} videos`)
    }

    // Add files
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
      console.log(`  ✓ Added ${files.length} files`)
    }

    console.log(`  ✓ Property ${propertyName} imported successfully`)
  } catch (error: any) {
    console.error(`  ✗ Error creating property ${propertyName}:`, error.message)
  }
}

// Main function
async function main() {
  const dataFolder = '/Users/danilstashok/Desktop/sgip data/Downtown'

  try {
    // Get or create Downtown area
    let area = await prisma.area.findUnique({
      where: { slug: 'downtown-dubai' },
    })

    if (!area) {
      area = await prisma.area.create({
        data: {
          id: 'test-area-1',
          name: 'Downtown Dubai',
          nameEn: 'Downtown Dubai',
          city: 'Dubai',
          slug: 'downtown-dubai',
        },
      })
      console.log('Created Downtown Dubai area')
    }

    // Read property folders
    const entries = await readdir(dataFolder, { withFileTypes: true })
    const propertyFolders = entries.filter(entry => entry.isDirectory())

    console.log(`Found ${propertyFolders.length} property folders`)

    for (const folder of propertyFolders) {
      const folderPath = join(dataFolder, folder.name)
      await processPropertyFolder(folderPath, folder.name, area.id)
    }

    console.log('\n✓ Import completed!')
  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

