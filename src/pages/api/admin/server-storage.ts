import type { NextApiRequest, NextApiResponse } from 'next'
import { execFileSync } from 'node:child_process'
import { ADMIN_SESSION_COOKIE, readCookie, verifyAdminSessionToken } from '@/lib/adminSession'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/server-storage')

function isAuthorized(req: NextApiRequest): boolean {
  const token = readCookie(req, ADMIN_SESSION_COOKIE)
  return verifyAdminSessionToken(token)
}

function readServerStoragePercent(): number {
  const output = execFileSync('df', ['-Pk', '/'], { encoding: 'utf8' })
  const lines = output.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('Unexpected df output: no data row')
  }

  const cols = lines[1].trim().split(/\s+/)
  if (cols.length < 5) {
    throw new Error('Unexpected df output: insufficient columns')
  }

  const capacity = cols[4]
  const percent = Number.parseFloat(capacity.replace('%', ''))
  if (!Number.isFinite(percent)) {
    throw new Error(`Unexpected df capacity value: ${capacity}`)
  }

  return Math.max(0, Math.min(100, percent))
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  try {
    const usagePercent = readServerStoragePercent()
    return res.status(200).json({ ok: true, usagePercent })
  } catch (error) {
    log.errorWithException('Failed to read server storage usage', error)
    return res.status(500).json({ ok: false, error: 'failed_to_read_server_storage' })
  }
}
