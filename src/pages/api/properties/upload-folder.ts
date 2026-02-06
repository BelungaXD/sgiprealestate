import type { NextApiRequest, NextApiResponse } from 'next'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import formidable, { File } from 'formidable'

/**
 * Upload folder only: saves files to uploads/incoming/{uploadId}/ preserving paths.
 * No DB import. If import-folder later fails, data stays here; no cleanup is done.
 * Client should call import-folder with returned folderPath after upload.
 */
export const config = {
  api: {
    bodyParser: false,
    maxDuration: 300,
    responseLimit: false,
  },
}

const INCOMING_BASE = join(process.cwd(), 'public', 'uploads', 'incoming')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const form = formidable({
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB per file
      maxTotalFileSize: 10 * 1024 * 1024 * 1024, // 10GB total
      keepExtensions: true,
      multiples: true,
      allowEmptyFiles: false,
      minFileSize: 0,
    })

    const [, files] = await form.parse(req)

    let fileArray: File[] = []
    if (files.files) {
      fileArray = Array.isArray(files.files) ? files.files : [files.files]
    }

    if (fileArray.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }

    const uploadId = String(Date.now())
    const baseDir = join(INCOMING_BASE, uploadId)
    await mkdir(baseDir, { recursive: true })

    let saved = 0
    for (const file of fileArray) {
      const relativePath = file.originalFilename || file.newFilename || ''
      if (!relativePath || relativePath.startsWith('.') || relativePath.includes('.DS_Store')) {
        continue
      }
      const destPath = join(baseDir, relativePath)
      await mkdir(dirname(destPath), { recursive: true })
      const buf = await readFile(file.filepath)
      await writeFile(destPath, buf)
      saved++
    }

    const folderPath = baseDir
    return res.status(200).json({
      message: 'Upload completed',
      folderPath,
      uploadId,
      filesSaved: saved,
    })
  } catch (error: unknown) {
    const err = error as { statusCode?: number; code?: string; message?: string }
    console.error('[upload-folder] Error:', err)

    if (
      err.statusCode === 413 ||
      err.code === 'LIMIT_FILE_SIZE' ||
      err.code === 'LIMIT_FIELD_VALUE' ||
      err.message?.includes('413') ||
      err.message?.includes('Payload Too Large') ||
      err.message?.includes('maxTotalFileSize') ||
      err.message?.includes('maxFileSize')
    ) {
      return res.status(413).json({
        message: 'File size exceeds server limit',
        error: 'The uploaded files are too large. Maximum size: 10GB total. Try uploading folders separately.',
        code: 'PAYLOAD_TOO_LARGE',
      })
    }

    return res.status(500).json({
      message: 'Error uploading folder',
      error: err.message || 'Unknown error',
    })
  }
}
