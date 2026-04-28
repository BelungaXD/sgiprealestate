import type { NextApiRequest, NextApiResponse } from 'next'
import { readFile, stat } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync, createReadStream } from 'fs'
import { createScopedLogger } from '@/lib/logger'

// Cache for public directory location to avoid repeated lookups
let cachedPublicDir: string | null = null

// Cache for optimized images (in-memory cache with size limit)
const imageCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>()
const MAX_CACHE_SIZE = 50 // Maximum number of cached images
const CACHE_TTL = 3600000 // 1 hour in milliseconds
const STREAM_DIRECT_THRESHOLD_BYTES = 4 * 1024 * 1024
const baseLog = createScopedLogger('api/uploads')

function log(message: string, details?: Record<string, unknown>) {
  baseLog.info(message, details)
}

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
    baseLog.errorWithException('Image optimization failed, serving original', error)
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
  log('Request received', {
    method: req.method,
    path: req.query.path,
    width: req.query.w,
    quality: req.query.q,
    format: req.query.f,
  })
  if (req.method !== 'GET') {
    baseLog.warn('Method not allowed', { method: req.method })
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { path } = req.query

    if (!path || !Array.isArray(path)) {
      baseLog.warn('Invalid upload path query', { path })
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
      log('Cache hit', { cacheKey, decodedPath: decodedPath.join('/') })
      res.setHeader('Content-Type', cached.contentType)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      return res.status(200).send(cached.buffer)
    }

    const publicDir = getPublicDir()
    const filePath = resolve(join(publicDir, 'uploads', ...decodedPath))
    const uploadsDir = resolve(join(publicDir, 'uploads'))

    // Security check
    if (!filePath.startsWith(uploadsDir)) {
      baseLog.warn('Access denied by uploads boundary check', { filePath, uploadsDir })
      return res.status(403).json({ message: 'Access denied' })
    }

    // Check if file exists locally, if not try to proxy from server
    if (!existsSync(filePath)) {
      // #region agent log
      fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b06bc3'},body:JSON.stringify({sessionId:'b06bc3',runId:'initial',hypothesisId:'H5',location:'src/pages/api/uploads/[...path].ts:161',message:'Upload file missing locally',data:{decodedPath:decodedPath.join('/'),filePath},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      baseLog.warn('Requested file not found locally', { filePath, decodedPath: decodedPath.join('/') })
      // Try to proxy from server if NEXT_PUBLIC_SERVER_URL is set
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
      if (serverUrl) {
        try {
          const serverPath = `/api/uploads/${decodedPath.join('/')}`
          const fullUrl = `${serverUrl.replace(/\/$/, '')}${serverPath}`
          
          // Add query parameters for optimization if present
          const queryParams = new URLSearchParams()
          if (width) queryParams.append('w', width.toString())
          if (quality) queryParams.append('q', quality.toString())
          if (format) queryParams.append('f', format)
          
          const proxyUrl = queryParams.toString() 
            ? `${fullUrl}?${queryParams.toString()}`
            : fullUrl
          
          const proxyResponse = await fetch(proxyUrl)
          
          if (proxyResponse.ok) {
            log('Proxied missing file from remote server', { proxyUrl, decodedPath: decodedPath.join('/') })
            const contentType = proxyResponse.headers.get('content-type') || 'application/octet-stream'
            const buffer = Buffer.from(await proxyResponse.arrayBuffer())
            
            res.setHeader('Content-Type', contentType)
            res.setHeader('Cache-Control', 'public, max-age=3600')
            return res.status(200).send(buffer)
          }
        } catch (proxyError) {
          baseLog.errorWithException('Failed to proxy from server', proxyError, {
            decodedPath: decodedPath.join('/'),
            serverUrl,
          })
        }
      }
      
      return res.status(404).json({ message: 'File not found' })
    }

    const fileStats = await stat(filePath)
    const fileSize = fileStats.size
    const ext = decodedPath[decodedPath.length - 1].split('.').pop()?.toLowerCase()
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')
    const isVideo = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', 'mpg', 'mpeg', '3gp', 'wmv'].includes(ext || '')

    let outputBuffer: Buffer
    let contentType: string

    if (isVideo || (!isImage && fileSize > STREAM_DIRECT_THRESHOLD_BYTES)) {
      const contentTypeMap: Record<string, string> = {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        webm: 'video/webm',
        mkv: 'video/x-matroska',
        m4v: 'video/x-m4v',
        mpg: 'video/mpeg',
        mpeg: 'video/mpeg',
        '3gp': 'video/3gpp',
        wmv: 'video/x-ms-wmv',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
      contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

      const range = req.headers.range
      if (range && isVideo) {
        const [startText, endText] = range.replace(/bytes=/, '').split('-')
        const start = Number.parseInt(startText, 10)
        const end = endText ? Number.parseInt(endText, 10) : fileSize - 1
        const safeStart = Number.isFinite(start) ? Math.max(0, start) : 0
        const safeEnd = Number.isFinite(end) ? Math.min(end, fileSize - 1) : fileSize - 1
        if (safeStart > safeEnd || safeStart >= fileSize) {
          res.setHeader('Content-Range', `bytes */${fileSize}`)
          return res.status(416).end()
        }
        const chunkSize = safeEnd - safeStart + 1
        log('streaming video range', { path: decodedPath.join('/'), fileSize, safeStart, safeEnd, chunkSize })
        res.writeHead(206, {
          'Content-Range': `bytes ${safeStart}-${safeEnd}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        })
        createReadStream(filePath, { start: safeStart, end: safeEnd }).pipe(res)
        return
      }

      if (fileSize > STREAM_DIRECT_THRESHOLD_BYTES) {
        log('streaming large file', { path: decodedPath.join('/'), fileSize, isVideo })
      }
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Length', fileSize)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      if (isVideo) {
        res.setHeader('Accept-Ranges', 'bytes')
      }
      createReadStream(filePath).pipe(res)
      return
    }

    // Small files/images are safe to read into memory
    const fileBuffer = await readFile(filePath)

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
      if (outputBuffer.length > STREAM_DIRECT_THRESHOLD_BYTES) {
        log('cached optimized image over 4MB', {
          path: decodedPath.join('/'),
          outputBytes: outputBuffer.length,
          width: width ?? null,
          quality,
          format: format || 'original',
        })
      }
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
  } catch (error: unknown) {
    baseLog.errorWithException('Error serving file', error, {
      path: req.query.path,
      cwd: process.cwd(),
      __dirname,
    })
    return res.status(500).json({ message: 'Internal server error' })
  }
}
