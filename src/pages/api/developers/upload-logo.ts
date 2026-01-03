import type { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Логотипы обычно небольшие
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
    const { file, filename } = req.body

    if (!file) {
      return res.status(400).json({ message: 'File is required' })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'developers')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = filename || 'logo'
    const ext = originalName.split('.').pop()?.toLowerCase() || 'png'
    const uniqueFilename = `${originalName.replace(/\.[^/.]+$/, '')}-${timestamp}.webp`

    const filePath = join(uploadsDir, uniqueFilename)

    // Handle base64 file
    if (file.startsWith('data:')) {
      // Extract base64 data
      const base64Data = file.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Convert to WebP and save
      try {
        await sharp(buffer)
          .webp({ quality: 90 })
          .toFile(filePath)
      } catch (sharpError) {
        console.error('Error converting logo to WebP:', sharpError)
        // Fallback: save original if WebP conversion fails
        await writeFile(filePath, buffer)
      }
    } else {
      // If it's already a URL, return it
      return res.status(200).json({
        success: true,
        url: file,
        filename: file.split('/').pop() || 'logo',
      })
    }

    const url = `/uploads/developers/${uniqueFilename}`

    return res.status(200).json({
      success: true,
      url,
      filename: uniqueFilename,
    })
  } catch (error: any) {
    console.error('Error uploading logo:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}

