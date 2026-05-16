import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hashInviteToken } from '@/lib/adminInvite'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/invite/validate')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const token = typeof req.query.token === 'string' ? req.query.token.trim() : ''
  if (!token) {
    return res.status(400).json({ ok: false, error: 'invalid_token' })
  }

  try {
    const admin = await prisma.admin.findFirst({
      where: {
        inviteTokenHash: hashInviteToken(token),
        isActive: true,
        inviteExpiresAt: { gt: new Date() },
      },
      select: { email: true, name: true, role: true, passwordSetAt: true },
    })

    if (!admin || admin.passwordSetAt) {
      return res.status(400).json({ ok: false, error: 'invalid_or_expired_token' })
    }

    return res.status(200).json({
      ok: true,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    })
  } catch (error) {
    log.errorWithException('Invite validate failed', error)
    return res.status(500).json({ ok: false, error: 'server_error' })
  }
}
