import type { NextApiRequest, NextApiResponse } from 'next'
import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

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

    // In standalone mode, public folder is at process.cwd()/public
    // Try multiple possible locations for the public folder
    const possiblePublicDirs = [
      join(process.cwd(), 'public'),
      join(process.cwd(), '..', 'public'),
      resolve(process.cwd(), 'public'),
      join(__dirname, '..', '..', '..', 'public'),
      join(__dirname, '..', '..', 'public'),
    ]

    let publicDir = possiblePublicDirs.find(dir => existsSync(dir))
    if (!publicDir) {
      // Fallback to standard location
      publicDir = join(process.cwd(), 'public')
    }

    // Construct file path - path array should be like ['developers', 'emaar_logo.png'] or ['team', 'Rustam Umurzakov.webp']
    const filePath = resolve(join(publicDir, 'uploads', ...path))

    // Security: Ensure the path is within the uploads directory
    const uploadsDir = resolve(join(publicDir, 'uploads'))
    if (!filePath.startsWith(uploadsDir)) {
      console.error('Access denied: path outside uploads directory', { filePath, uploadsDir })
      return res.status(403).json({ message: 'Access denied' })
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error('File not found:', filePath, 'Checked dirs:', possiblePublicDirs.filter(existsSync))
      return res.status(404).json({ message: 'File not found', path: filePath })
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath)

    // Determine content type based on file extension
    const ext = path[path.length - 1].split('.').pop()?.toLowerCase()
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

    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.status(200).send(fileBuffer)
  } catch (error: any) {
    console.error('Error serving file:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
