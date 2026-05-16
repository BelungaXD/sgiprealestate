import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { createScopedLogger } from '@/lib/logger'
import { hashAdminPassword } from '@/lib/adminSession'
import { requireAdminSession } from '@/lib/adminAuth'
import {
  buildAdminInviteUrl,
  createInviteToken,
  hashInviteToken,
  inviteExpiresAt,
} from '@/lib/adminInvite'
import { sendAdminInviteEmail } from '@/lib/sendTransactionalEmail'

const createUserSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR']),
})

const log = createScopedLogger('api/admin/users')

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  avatarUrl: true,
  passwordSetAt: true,
  inviteExpiresAt: true,
  createdAt: true,
  updatedAt: true,
} as const

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager / Agent',
  CONTENT_EDITOR: 'Content Manager',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'manage_users' })
  if (!session) return

  if (req.method === 'GET') {
    try {
      const users = await prisma.admin.findMany({
        select: userSelect,
        orderBy: { createdAt: 'asc' },
      })

      return res.status(200).json({ ok: true, users })
    } catch (error) {
      log.errorWithException('Failed to load admin users', error)
      return res.status(500).json({ ok: false, error: 'failed_to_load_users' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = createUserSchema.parse(body)
      const email = parsed.email.trim().toLowerCase()
      const name = parsed.name?.trim() || null
      const inviteToken = createInviteToken()
      const placeholderPassword = hashAdminPassword(
        crypto.randomBytes(32).toString('base64url')
      )

      const user = await prisma.admin.create({
        data: {
          email,
          name,
          password: placeholderPassword,
          role: parsed.role,
          isActive: true,
          passwordSetAt: null,
          inviteTokenHash: hashInviteToken(inviteToken),
          inviteExpiresAt: inviteExpiresAt(),
        },
        select: userSelect,
      })

      const inviteUrl = buildAdminInviteUrl(inviteToken)
      const emailResult = await sendAdminInviteEmail({
        to: email,
        inviteUrl,
        roleLabel: ROLE_LABELS[parsed.role] || parsed.role,
      })

      return res.status(201).json({
        ok: true,
        user,
        inviteUrl,
        emailSent: emailResult.ok,
        emailConfigured: emailResult.ok || emailResult.reason !== 'not_configured',
      })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: 'invalid_payload', issues: error.issues })
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ ok: false, error: 'email_already_exists' })
      }
      log.errorWithException('Failed to create admin user', error)
      return res.status(500).json({ ok: false, error: 'failed_to_create_user' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
