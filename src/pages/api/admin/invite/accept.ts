import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashAdminPassword } from '@/lib/adminSession'
import { hashInviteToken } from '@/lib/adminInvite'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/invite/accept')

const acceptSchema = z.object({
  token: z.string().min(16).max(256),
  password: z.string().min(8).max(128),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const parsed = acceptSchema.parse(body)
    const tokenHash = hashInviteToken(parsed.token.trim())

    const admin = await prisma.admin.findFirst({
      where: {
        inviteTokenHash: tokenHash,
        isActive: true,
        inviteExpiresAt: { gt: new Date() },
        passwordSetAt: null,
      },
      select: { id: true },
    })

    if (!admin) {
      return res.status(400).json({ ok: false, error: 'invalid_or_expired_token' })
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashAdminPassword(parsed.password),
        passwordSetAt: new Date(),
        inviteTokenHash: null,
        inviteExpiresAt: null,
        lastLoginAt: null,
      },
    })

    return res.status(200).json({ ok: true })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: 'invalid_payload', issues: error.issues })
    }
    log.errorWithException('Invite accept failed', error)
    return res.status(500).json({ ok: false, error: 'server_error' })
  }
}
