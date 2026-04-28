import type { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { writePropertyListingThumbnail } from '@/lib/propertyThumbnails'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/properties/upload-image')

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '800mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { file, filename, mimeType } = req.body
    // #region agent log
    fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b4373'},body:JSON.stringify({sessionId:'3b4373',runId:'initial',hypothesisId:'H4',location:'src/pages/api/properties/upload-image.ts:handler-entry',message:'Upload API handler entered',data:{method:req.method,hasFile:Boolean(file),hasFilename:Boolean(filename),mimeType:typeof mimeType==='string'?mimeType:null,fileType:typeof file,fileLength:typeof file==='string'?file.length:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!file || !filename) {
      return res.status(400).json({ message: 'File and filename are required' })
    }

    // Determine if it's an image or video
    const isVideo = mimeType?.startsWith('video/') || file.startsWith('data:video/')
    const isImage = mimeType?.startsWith('image/') || file.startsWith('data:image/')

    // Create uploads directory based on file type
    let uploadsDir: string
    if (isVideo) {
      uploadsDir = join(process.cwd(), 'public', 'uploads', 'properties', 'videos')
    } else {
      uploadsDir = join(process.cwd(), 'public', 'uploads', 'properties', 'images')
    }

    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`
    const filePath = join(uploadsDir, uniqueFilename)

    // Handle base64 file
    if (file.startsWith('data:')) {
      // Extract base64 data
      const base64Data = file.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      // #region agent log
      fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b4373'},body:JSON.stringify({sessionId:'3b4373',runId:'initial',hypothesisId:'H5',location:'src/pages/api/properties/upload-image.ts:buffer-built',message:'Decoded base64 payload',data:{isVideo,isImage,uploadsDir,filePath,bufferBytes:buffer.byteLength},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      // For images, generate thumbnail and save both full and thumbnail
      if (isImage && !isVideo) {
        // Save full image
        await writeFile(filePath, buffer)
        
        // Listing thumbnail: small file for grid cards (see propertyThumbnails)
        const thumbnailDir = join(uploadsDir, 'thumbnails')
        if (!existsSync(thumbnailDir)) {
          await mkdir(thumbnailDir, { recursive: true })
        }
        
        const thumbnailPath = join(thumbnailDir, uniqueFilename)
        
        try {
          await writePropertyListingThumbnail(buffer, thumbnailPath)
        } catch (sharpError) {
          log.warn('Failed to generate thumbnail', {
            error: sharpError instanceof Error ? sharpError.message : String(sharpError),
            filename: uniqueFilename,
          })
        }
      } else {
        // For videos, just save the file
        await writeFile(filePath, buffer)
      }
      // #region agent log
      fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3b4373'},body:JSON.stringify({sessionId:'3b4373',runId:'initial',hypothesisId:'H6',location:'src/pages/api/properties/upload-image.ts:file-written',message:'File write completed',data:{filePath,urlType:isVideo?'video':'image'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } else {
      // If it's already a URL, return it
      return res.status(200).json({
        success: true,
        url: isVideo 
          ? `/uploads/properties/videos/${uniqueFilename}`
          : `/uploads/properties/images/${uniqueFilename}`,
        filename: uniqueFilename,
      })
    }

    const url = isVideo
      ? `/uploads/properties/videos/${uniqueFilename}`
      : `/uploads/properties/images/${uniqueFilename}`

    return res.status(200).json({
      success: true,
      url,
      filename: uniqueFilename,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    log.errorWithException('Error uploading image/video', error)
    return res.status(500).json({
      success: false,
      message,
    })
  }
}

