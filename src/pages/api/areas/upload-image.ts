import type { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import sharp from 'sharp'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
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

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'areas')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const originalName = filename || 'cover'
    const uniqueFilename = `${originalName.replace(/\.[^/.]+$/, '')}-${timestamp}.webp`
    const filePath = join(uploadsDir, uniqueFilename)

    if (file.startsWith('data:')) {
      const base64Data = file.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      try {
        await sharp(buffer).webp({ quality: 90 }).toFile(filePath)
      } catch (sharpError) {
        console.error('Error converting area image to WebP:', sharpError)
        await writeFile(filePath, buffer)
      }
    } else {
      return res.status(200).json({
        success: true,
        url: file,
        filename: file.split('/').pop() || 'cover',
      })
    }

    const url = `/uploads/areas/${uniqueFilename}`

    return res.status(200).json({
      success: true,
      url,
      filename: uniqueFilename,
    })
  } catch (error: any) {
    console.error('Error uploading area image:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
