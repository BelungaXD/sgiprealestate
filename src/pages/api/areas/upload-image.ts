import type { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/areas/upload-image')

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
    const { file, filename } = req.body

    if (!file || !filename) {
      return res.status(400).json({ message: 'File and filename are required' })
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'areas')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const sanitizedFilename = String(filename).replace(/[^a-zA-Z0-9.-]/g, '_')
    const originalName = sanitizedFilename || 'cover'
    const uniqueFilename = `${originalName.replace(/\.[^/.]+$/, '')}-${timestamp}.webp`
    const filePath = join(uploadsDir, uniqueFilename)

    if (file.startsWith('data:')) {
      const base64Data = file.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      await writeFile(filePath, buffer)
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    log.errorWithException('Error uploading area image', error)
    return res.status(500).json({
      success: false,
      message,
    })
  }
}
