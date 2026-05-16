import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminSession } from '@/lib/adminAuth'
import { createScopedLogger } from '@/lib/logger'
import { readServerDiskUsage } from '@/lib/serverDiskUsage'

const log = createScopedLogger('api/admin/server-storage')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdminSession(req, res, { permission: 'system_settings' })) {
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  try {
    const disk = readServerDiskUsage()
    return res.status(200).json({
      ok: true,
      usagePercent: disk.usagePercent,
      host: disk.host,
      ...disk,
    })
  } catch (error) {
    log.errorWithException('Failed to read server storage usage', error)
    return res.status(500).json({ ok: false, error: 'failed_to_read_server_storage' })
  }
}
