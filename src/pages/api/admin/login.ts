import type { NextApiRequest, NextApiResponse } from 'next'
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  createAdminSessionToken,
  shouldUseSecureAdminSessionCookie,
  verifyAdminCredentials,
} from '@/lib/adminSession'
import { createScopedLogger } from '@/lib/logger'

type Body = { username?: string; password?: string }
const log = createScopedLogger('api/admin/login')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    log.warn('Method not allowed', { method: req.method })
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  if (!adminSessionConfigured()) {
    log.error('Admin session is not configured')
    return res.status(503).json({ ok: false, error: 'admin_not_configured' })
  }

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Body
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  try {
    const isValid = await verifyAdminCredentials(username, password)
    if (!isValid) {
      log.warn('Invalid admin credentials', { username })
      return res.status(401).json({ ok: false, error: 'invalid_credentials' })
    }

    const token = createAdminSessionToken()
    if (!token) {
      log.error('Failed to create admin session token', { username })
      return res.status(500).json({ ok: false, error: 'session_error' })
    }

    const maxAge = 60 * 60 * 24 * 7
    const secure = shouldUseSecureAdminSessionCookie(req) ? '; Secure' : ''
    res.setHeader(
      'Set-Cookie',
      `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
    )

    log.info('Admin login successful', { username })
    return res.status(200).json({ ok: true })
  } catch (error) {
    log.errorWithException('Admin login error', error, { username })
    return res.status(500).json({ ok: false, error: 'server_error' })
  }
}
