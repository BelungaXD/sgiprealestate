import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminSession } from '@/lib/adminAuth'
import { mediaLibraryUsedBytes, mediaStorageLimitBytes, formatBytes } from '@/lib/mediaLibrary/storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'manage_media' })
  if (!session) return

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const usedBytes = await mediaLibraryUsedBytes()
  const limitBytes = mediaStorageLimitBytes()
  const percent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0

  return res.status(200).json({
    ok: true,
    usedBytes,
    limitBytes,
    percent,
    usedLabel: formatBytes(usedBytes),
    limitLabel: formatBytes(limitBytes),
  })
}
