import type { NextApiRequest, NextApiResponse } from 'next'
import { ADMIN_SESSION_COOKIE, readCookie, verifyAdminSessionToken } from '@/lib/adminSession'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false })
  }

  const token = readCookie(req, ADMIN_SESSION_COOKIE)
  const ok = verifyAdminSessionToken(token)
  return res.status(200).json({ ok })
}
