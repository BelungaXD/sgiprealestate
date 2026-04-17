import type { NextApiRequest, NextApiResponse } from 'next'
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  createAdminSessionToken,
  useSecureAdminSessionCookie,
  verifyAdminCredentials,
} from '@/lib/adminSession'

type Body = { username?: string; password?: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  if (!adminSessionConfigured()) {
    return res.status(503).json({ ok: false, error: 'admin_not_configured' })
  }

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Body
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  try {
    const isValid = await verifyAdminCredentials(username, password)
    if (!isValid) {
      return res.status(401).json({ ok: false, error: 'invalid_credentials' })
    }

    const token = createAdminSessionToken()
    if (!token) {
      return res.status(500).json({ ok: false, error: 'session_error' })
    }

    const maxAge = 60 * 60 * 24 * 7
    const secure = useSecureAdminSessionCookie(req) ? '; Secure' : ''
    res.setHeader(
      'Set-Cookie',
      `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
    )

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Admin login error:`, error)
    return res.status(500).json({ ok: false, error: 'server_error' })
  }
}
