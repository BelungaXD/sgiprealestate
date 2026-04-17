import type { NextApiRequest, NextApiResponse } from 'next'
import { mkdir, copyFile } from 'fs/promises'
import { join, dirname, normalize } from 'path'
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
const LOG_SCOPE = 'upload-folder'

function log(message: string, details?: Record<string, unknown>) {
  const ts = new Date().toISOString()
  if (details) {
    console.info(`[${ts}] [${LOG_SCOPE}] ${message}`, details)
    return
  }
  console.info(`[${ts}] [${LOG_SCOPE}] ${message}`)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const startedAt = Date.now()
    log('request started')

    const form = formidable({
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB per file
      maxTotalFileSize: 10 * 1024 * 1024 * 1024, // 10GB total
      keepExtensions: true,
      multiples: true,
      allowEmptyFiles: false,
      minFileSize: 0,
    })

    const [, files] = await form.parse(req)
    log('form parsed')

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
    log('incoming directory ready', { uploadId, baseDir, files: fileArray.length })

    let saved = 0
    const skipped: string[] = []
    for (const file of fileArray) {
      const relativePath = file.originalFilename || file.newFilename || ''
      if (!relativePath || relativePath.startsWith('.') || relativePath.includes('.DS_Store')) {
        skipped.push(relativePath || 'unknown')
        continue
      }
      const safeRelativePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '')
      if (!safeRelativePath || safeRelativePath.startsWith('..')) {
        skipped.push(relativePath)
        continue
      }
      const destPath = join(baseDir, safeRelativePath)
      await mkdir(dirname(destPath), { recursive: true })
      // copyFile avoids loading entire media file into JS memory.
      await copyFile(file.filepath, destPath)
      saved++
      if (saved % 50 === 0) {
        log('files copied progress', { saved, total: fileArray.length })
      }
    }

    const folderPath = baseDir
    log('request completed', {
      uploadId,
      filesReceived: fileArray.length,
      filesSaved: saved,
      filesSkipped: skipped.length,
      durationMs: Date.now() - startedAt,
    })
    return res.status(200).json({
      message: 'Upload completed',
      folderPath,
      uploadId,
      filesSaved: saved,
    })
  } catch (error: unknown) {
    const err = error as { statusCode?: number; code?: string; message?: string }
    console.error(`[${new Date().toISOString()}] [${LOG_SCOPE}] Error:`, err)

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
