import type { NextApiRequest, NextApiResponse } from 'next'
import { readFile, stat } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync, readdirSync } from 'fs'

// Cache for public directory location to avoid repeated lookups
let cachedPublicDir: string | null = null

// Cache for optimized images (in-memory cache with size limit)
const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>()
const MAX_CACHE_SIZE = 50 // Maximum number of cached images
const CACHE_TTL = 3600000 // 1 hour in milliseconds

function getPublicDir(): string {
  if (cachedPublicDir) {
    return cachedPublicDir
  }

  const possiblePublicDirs = [
    join(process.cwd(), 'public'),
    join(process.cwd(), '..', 'public'),
    resolve(process.cwd(), 'public'),
    join(__dirname, '..', '..', '..', 'public'),
    join(__dirname, '..', '..', 'public'),
    join(process.cwd(), '..', '..', 'public'),
    resolve(__dirname, '..', '..', '..', '..', 'public'),
  ]

  const publicDir = possiblePublicDirs.find(dir => {
    const exists = existsSync(dir)
    if (exists) {
      const uploadsPath = join(dir, 'uploads')
      return existsSync(uploadsPath)
    }
    return false
  }) || possiblePublicDirs.find(dir => existsSync(dir)) || join(process.cwd(), 'public')

  cachedPublicDir = publicDir
  return publicDir
}

async function optimizeImage(
  fileBuffer: Buffer,
  width?: number,
  quality: number = 85,
  format?: 'webp' | 'avif',
  originalFormat?: string
): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const sharp = require('sharp')
    
    let pipeline = sharp(fileBuffer)

    // Resize if width is specified
    if (width) {
      pipeline = pipeline.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
    }

    // Convert format if specified
    if (format === 'webp') {
      const buffer = await pipeline.webp({ quality }).toBuffer()
      return { buffer, contentType: 'image/webp' }
    } else if (format === 'avif') {
      const buffer = await pipeline.avif({ quality }).toBuffer()
      return { buffer, contentType: 'image/avif' }
    }

    // Optimize based on original format
    if (originalFormat === 'png') {
      const buffer = await pipeline.png({ quality, compressionLevel: 9 }).toBuffer()
      return { buffer, contentType: 'image/png' }
    } else if (originalFormat === 'webp') {
      const buffer = await pipeline.webp({ quality }).toBuffer()
      return { buffer, contentType: 'image/webp' }
    } else {
      // Default: JPEG optimization
      const buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer()
      return { buffer, contentType: 'image/jpeg' }
    }
  } catch (error) {
    // If sharp is not available or optimization fails, return original
    console.warn('Image optimization failed, serving original:', error)
    const contentTypeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    }
    return { 
      buffer: fileBuffer, 
      contentType: contentTypeMap[originalFormat || ''] || 'image/jpeg' 
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { path } = req.query

    if (!path || !Array.isArray(path)) {
      return res.status(400).json({ message: 'Invalid path' })
    }

    // Decode URL-encoded path segments
    const decodedPath = path.map(segment => decodeURIComponent(segment))

    // Get Next.js Image optimization parameters
    const width = req.query.w ? parseInt(req.query.w as string, 10) : undefined
    const quality = req.query.q ? parseInt(req.query.q as string, 10) : 85
    const format = req.query.f as 'webp' | 'avif' | undefined

    // Check cache first
    const cacheKey = `${decodedPath.join('/')}_${width || 'full'}_${quality}_${format || 'original'}`
    const cached = imageCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.setHeader('Content-Type', cached.contentType)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      return res.status(200).send(cached.buffer)
    }

    const publicDir = getPublicDir()
    const filePath = resolve(join(publicDir, 'uploads', ...decodedPath))
    const uploadsDir = resolve(join(publicDir, 'uploads'))

    // Security check
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' })
    }

    // Read file
    const fileBuffer = await readFile(filePath)
    const ext = decodedPath[decodedPath.length - 1].split('.').pop()?.toLowerCase()
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')

    let outputBuffer: Buffer
    let contentType: string

    // Optimize images if parameters are provided
    if (isImage && (width || format)) {
      const optimized = await optimizeImage(fileBuffer, width, quality, format, ext)
      outputBuffer = optimized.buffer
      contentType = optimized.contentType

      // Cache optimized image
      if (imageCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = imageCache.keys().next().value
        if (firstKey) {
          imageCache.delete(firstKey)
        }
      }
      imageCache.set(cacheKey, {
        buffer: outputBuffer,
        contentType,
        timestamp: Date.now(),
      })
    } else {
      // Serve original file
      const contentTypeMap: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
      contentType = contentTypeMap[ext || ''] || 'application/octet-stream'
      outputBuffer = fileBuffer
    }

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.status(200).send(outputBuffer)
  } catch (error: any) {
    console.error('Error serving file:', {
      error: error.message,
      stack: error.stack,
      path: req.query.path,
      cwd: process.cwd(),
      __dirname,
    })
    return res.status(500).json({ message: 'Internal server error' })
  }
}
