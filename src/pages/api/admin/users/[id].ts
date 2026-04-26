import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ADMIN_SESSION_COOKIE, readCookie, verifyAdminSessionToken } from '@/lib/adminSession'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/users/[id]')

function isAuthorized(req: NextApiRequest): boolean {
  const token = readCookie(req, ADMIN_SESSION_COOKIE)
  return verifyAdminSessionToken(token)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const id = req.query.id
  if (typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ ok: false, error: 'invalid_user_id' })
  }

  try {
    const count = await prisma.admin.count()
    if (count <= 1) {
      return res.status(409).json({ ok: false, error: 'cannot_delete_last_user' })
    }

    await prisma.admin.delete({ where: { id } })
    return res.status(200).json({ ok: true })
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ ok: false, error: 'user_not_found' })
    }
    log.errorWithException('Failed to delete admin user', error)
    return res.status(500).json({ ok: false, error: 'failed_to_delete_user' })
  }
}
