import type { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'properties', 'files')
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
      await writeFile(filePath, buffer)
    } else {
      // If it's already a URL, return it
      return res.status(200).json({
        success: true,
        url: `/uploads/properties/files/${uniqueFilename}`,
        filename: uniqueFilename,
      })
    }

    const url = `/uploads/properties/files/${uniqueFilename}`

    return res.status(200).json({
      success: true,
      url,
      filename: uniqueFilename,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}

