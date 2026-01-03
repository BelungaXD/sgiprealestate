import type { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

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
      
      // For images, generate thumbnail and save both full and thumbnail
      if (isImage && !isVideo) {
        // Save full image
        await writeFile(filePath, buffer)
        
        // Generate thumbnail (200x200px max, maintaining aspect ratio)
        const thumbnailDir = join(uploadsDir, 'thumbnails')
        if (!existsSync(thumbnailDir)) {
          await mkdir(thumbnailDir, { recursive: true })
        }
        
        const thumbnailPath = join(thumbnailDir, uniqueFilename)
        
        try {
          await sharp(buffer)
            .resize(200, 200, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .webp({ quality: 70 })
            .toFile(thumbnailPath)
        } catch (sharpError) {
          console.warn('Failed to generate thumbnail:', sharpError)
          // Continue without thumbnail if generation fails
        }
      } else {
        // For videos, just save the file
        await writeFile(filePath, buffer)
      }
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
  } catch (error: any) {
    console.error('Error uploading image/video:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}

