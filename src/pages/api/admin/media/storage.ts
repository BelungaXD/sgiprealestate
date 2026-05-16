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
  try {
    server = readServerDiskUsage(serverDiskCheckPath())
  } catch (error) {
    log.errorWithException('Failed to read server disk for media settings', error)
  }

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
