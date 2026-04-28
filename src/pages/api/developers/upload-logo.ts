import type { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/developers/upload-logo')

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
    // #region agent log
    fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5e5a6'},body:JSON.stringify({sessionId:'c5e5a6',runId:'initial',hypothesisId:'H4',location:'src/pages/api/developers/upload-logo.ts:29',message:'Upload-logo handler input',data:{hasFile:!!file,filename:filename||null,isDataUrl:typeof file==='string'?file.startsWith('data:'):false,fileLength:typeof file==='string'?file.length:0},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    if (!file || !filename) {
      return res.status(400).json({ message: 'File and filename are required' })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'developers')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFilename = String(filename).replace(/[^a-zA-Z0-9.-]/g, '_')
    const originalName = sanitizedFilename || 'logo'
    const uniqueFilename = `${originalName.replace(/\.[^/.]+$/, '')}-${timestamp}.webp`

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
        url: file,
        filename: file.split('/').pop() || 'logo',
      })
    }

    const url = `/uploads/developers/${uniqueFilename}`
    // #region agent log
    fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5e5a6'},body:JSON.stringify({sessionId:'c5e5a6',runId:'initial',hypothesisId:'H4',location:'src/pages/api/developers/upload-logo.ts:76',message:'Upload-logo file write result',data:{uploadsDir,filePath,existsAfterWrite:existsSync(filePath),url},timestamp:Date.now()})}).catch(()=>{})
    // #endregion

    return res.status(200).json({
      success: true,
      url,
      filename: uniqueFilename,
    })
  } catch (error: unknown) {
    // #region agent log
    fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c5e5a6'},body:JSON.stringify({sessionId:'c5e5a6',runId:'iteration2',hypothesisId:'H11',location:'src/pages/api/developers/upload-logo.ts:85',message:'Upload-logo handler error catch',data:{message:error instanceof Error?error.message:'unknown'},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    const message = error instanceof Error ? error.message : 'Internal server error'
    log.errorWithException('Error uploading logo', error)
    return res.status(500).json({
      success: false,
      message,
    })
  }
}

