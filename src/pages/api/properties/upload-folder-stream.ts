import type { NextApiRequest, NextApiResponse } from 'next'
import { mkdir, unlink } from 'fs/promises'
import { createWriteStream } from 'fs'
import { join, dirname, normalize, resolve, relative as pathRelative } from 'path'
import { pipeline } from 'stream/promises'
import { createScopedLogger } from '@/lib/logger'

/**
 * Stream one file per request directly to disk. No multipart, no formidable, no temp copy.
 * Client runs multiple of these in parallel to saturate the uplink.
 *
 * Query params:
 *   uploadId  — client-generated batch id (sticky across all files of one folder)
 *   path      — relative path inside the batch (e.g. "Beachfront - Maison/IMG_01.jpg")
 *
 * Body: raw file bytes (Content-Type: application/octet-stream).
 */
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    maxDuration: 300,
  },
}

const INCOMING_BASE = join(process.cwd(), 'public', 'uploads', 'incoming')
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB per file
const LOG_SCOPE = 'upload-folder-stream'
const baseLog = createScopedLogger(`api/properties/${LOG_SCOPE}`)

function log(msg: string, details?: Record<string, unknown>) {
  baseLog.info(msg, details)
}

function sanitizeUploadId(raw: string): string | null {
  if (!raw) return null
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(raw)) return null
  return raw
}

function sanitizeRelPath(raw: string): string | null {
  if (!raw) return null
  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return null
  }
  if (decoded.includes('\0')) return null
  const normalized = normalize(decoded.replace(/\\/g, '/'))
  if (!normalized || normalized === '.' || normalized.startsWith('..')) return null
  if (normalized.startsWith('/')) return null
  return normalized
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const startedAt = Date.now()
  const uploadId = sanitizeUploadId(String(req.query.uploadId || ''))
  const relPath = sanitizeRelPath(String(req.query.path || ''))

  if (!uploadId) {
    return res.status(400).json({ message: 'uploadId query param is required (alphanumeric, _, -; max 64)' })
  }
  if (!relPath) {
    return res.status(400).json({ message: 'path query param is invalid' })
  }

  const contentLengthRaw = req.headers['content-length']
  const contentLength = contentLengthRaw ? Number(contentLengthRaw) : 0
  if (contentLength && contentLength > MAX_FILE_BYTES) {
    return res.status(413).json({ message: 'File exceeds per-file limit', maxBytes: MAX_FILE_BYTES })
  }

  const baseDir = resolve(join(INCOMING_BASE, uploadId))
  const destPath = resolve(join(baseDir, relPath))

  const rel = pathRelative(baseDir, destPath)
  if (!rel || rel.startsWith('..') || rel.includes('\0')) {
    return res.status(400).json({ message: 'path escapes upload dir' })
  }

  try {
    await mkdir(dirname(destPath), { recursive: true })

    let bytes = 0
    req.on('data', (chunk: Buffer) => {
      bytes += chunk.length
      if (bytes > MAX_FILE_BYTES) {
        req.destroy(new Error('stream exceeded per-file limit'))
      }
    })

    try {
      await pipeline(req, createWriteStream(destPath))
    } catch (streamErr) {
      // Client abort or size-limit: drop partial file so caller can retry cleanly.
      try { await unlink(destPath) } catch { /* ignore */ }
      throw streamErr
    }

    log('file saved', {
      uploadId,
      relPath,
      bytes,
      contentLength,
      durationMs: Date.now() - startedAt,
    })

    return res.status(200).json({
      uploadId,
      folderPath: baseDir,
      relPath,
      bytes,
    })
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string }
    baseLog.error('upload-folder-stream error', {
      uploadId,
      relPath,
      error: err.message || err,
      code: err.code,
      durationMs: Date.now() - startedAt,
    })
    return res.status(500).json({ message: 'Upload failed', error: err.message || 'Unknown error' })
  }
}
