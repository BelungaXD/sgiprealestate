import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminSession } from '@/lib/adminAuth'
import { createScopedLogger } from '@/lib/logger'
import { mediaLibraryUsedBytes, mediaStorageLimitBytes, formatBytes } from '@/lib/mediaLibrary/storage'
import { readServerDiskUsage, serverDiskCheckPath } from '@/lib/serverDiskUsage'

const log = createScopedLogger('api/admin/media/storage')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'manage_media' })
  if (!session) return

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const usedBytes = await mediaLibraryUsedBytes()
  const limitBytes = mediaStorageLimitBytes()
  const percent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0

  let server: ReturnType<typeof readServerDiskUsage> | null = null
  let serverError: string | null = null
  try {
    server = readServerDiskUsage(serverDiskCheckPath())
  } catch (error) {
    serverError = error instanceof Error ? error.message : 'unknown'
    log.errorWithException('Failed to read server disk for media settings', error)
  }

  // #region agent log
  fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'98da29'},body:JSON.stringify({sessionId:'98da29',runId:'pre-fix',hypothesisId:'H1-H3-H5',location:'media/storage.ts:handler',message:'storage API response',data:{checkPath:serverDiskCheckPath(),libraryPercent:percent,libraryUsedBytes:usedBytes,libraryLimitBytes:limitBytes,serverOk:!!server,serverPercent:server?.usagePercent??null,serverPath:server?.path??null,serverError,host:req.headers.host??null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return res.status(200).json({
    ok: true,
    usedBytes,
    limitBytes,
    percent,
    usedLabel: formatBytes(usedBytes),
    limitLabel: formatBytes(limitBytes),
    server: server
      ? {
          ok: true,
          host: server.host,
          path: server.path,
          usagePercent: server.usagePercent,
          totalBytes: server.totalBytes,
          usedBytes: server.usedBytes,
          availableBytes: server.availableBytes,
          totalLabel: server.totalLabel,
          usedLabel: server.usedLabel,
          availableLabel: server.availableLabel,
        }
      : { ok: false },
  })
}
