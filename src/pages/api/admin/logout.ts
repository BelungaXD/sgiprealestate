import type { NextApiRequest, NextApiResponse } from 'next'
import { ADMIN_SESSION_COOKIE, useSecureAdminSessionCookie } from '@/lib/adminSession'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false })
  }

  const secure = useSecureAdminSessionCookie(req) ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
  )

  return res.status(200).json({ ok: true })
}
