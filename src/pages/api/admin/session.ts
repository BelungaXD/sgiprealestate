import type { NextApiRequest, NextApiResponse } from 'next'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/adminSession'

function readCookie(req: NextApiRequest, name: string): string | undefined {
  const raw = req.headers.cookie
  if (!raw) return undefined
  const parts = raw.split(';')
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=')
    if (k === name && rest.length) {
      return decodeURIComponent(rest.join('='))
    }
  }
  return undefined
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false })
  }

  const token = readCookie(req, ADMIN_SESSION_COOKIE)
  const ok = verifyAdminSessionToken(token)
  return res.status(200).json({ ok })
}
