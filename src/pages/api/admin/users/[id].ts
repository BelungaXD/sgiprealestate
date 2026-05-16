import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashAdminPassword } from '@/lib/adminSession'
import { requireAdminSession } from '@/lib/adminAuth'
import {
  buildAdminInviteUrl,
  createInviteToken,
  generateStrongPassword,
  hashInviteToken,
  inviteExpiresAt,
} from '@/lib/adminInvite'
import { sendAdminInviteEmail } from '@/lib/sendTransactionalEmail'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/users/[id]')

const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR']).optional(),
  isActive: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
  resendInvite: z.boolean().optional(),
})

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

async function countActiveSuperAdmins(excludeId?: string): Promise<number> {
  return prisma.admin.count({
    where: {
      role: 'SUPER_ADMIN',
      isActive: true,
      passwordSetAt: { not: null },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'manage_users' })
  if (!session) return

  const id = req.query.id
  if (typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ ok: false, error: 'invalid_user_id' })
  }

  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updateUserSchema.parse(body)

      const existing = await prisma.admin.findUnique({
        where: { id },
        select: { id: true, role: true, isActive: true, email: true, passwordSetAt: true },
      })
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'user_not_found' })
      }

      if (session.adminId === id && parsed.isActive === false) {
        return res.status(409).json({ ok: false, error: 'cannot_deactivate_self' })
      }

      const nextRole = parsed.role ?? existing.role
      const nextActive = parsed.isActive ?? existing.isActive

      if (existing.role === 'SUPER_ADMIN' && nextRole !== 'SUPER_ADMIN') {
        const others = await countActiveSuperAdmins(id)
        if (others === 0) {
          return res.status(409).json({ ok: false, error: 'cannot_remove_last_super_admin' })
        }
      }

      if (existing.role === 'SUPER_ADMIN' && nextActive === false) {
        const others = await countActiveSuperAdmins(id)
        if (others === 0) {
          return res.status(409).json({ ok: false, error: 'cannot_deactivate_last_super_admin' })
        }
      }

      let temporaryPassword: string | undefined
      let inviteUrl: string | undefined
      let emailSent = false
      const data: {
        name?: string | null
        role?: typeof parsed.role
        isActive?: boolean
        password?: string
        inviteTokenHash?: string | null
        inviteExpiresAt?: Date | null
        passwordSetAt?: Date | null
      } = {}

      if (parsed.name !== undefined) {
        data.name = parsed.name?.trim() || null
      }
      if (parsed.role !== undefined) {
        data.role = parsed.role
      }
      if (parsed.isActive !== undefined) {
        data.isActive = parsed.isActive
      }
      if (parsed.resetPassword) {
        temporaryPassword = generateStrongPassword()
        data.password = hashAdminPassword(temporaryPassword)
        data.passwordSetAt = new Date()
        data.inviteTokenHash = null
        data.inviteExpiresAt = null
      }

      if (parsed.resendInvite) {
        if (existing.passwordSetAt) {
          return res.status(409).json({ ok: false, error: 'user_already_activated' })
        }
        const inviteToken = createInviteToken()
        data.inviteTokenHash = hashInviteToken(inviteToken)
        data.inviteExpiresAt = inviteExpiresAt()
        inviteUrl = buildAdminInviteUrl(inviteToken)
        const roleKey = parsed.role ?? existing.role
        const emailResult = await sendAdminInviteEmail({
          to: existing.email,
          inviteUrl,
          roleLabel: ROLE_LABELS[roleKey] || roleKey,
        })
        emailSent = emailResult.ok
      }

      const user = await prisma.admin.update({
        where: { id },
        data,
        select: userSelect,
      })

      return res.status(200).json({
        ok: true,
        user,
        ...(temporaryPassword ? { temporaryPassword } : {}),
        ...(inviteUrl ? { inviteUrl, emailSent } : {}),
      })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: 'invalid_payload', issues: error.issues })
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ ok: false, error: 'user_not_found' })
      }
      log.errorWithException('Failed to update admin user', error)
      return res.status(500).json({ ok: false, error: 'failed_to_update_user' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      if (session.adminId === id) {
        return res.status(409).json({ ok: false, error: 'cannot_delete_self' })
      }

      const existing = await prisma.admin.findUnique({
        where: { id },
        select: { role: true, passwordSetAt: true },
      })
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'user_not_found' })
      }

      if (!existing.passwordSetAt) {
        await prisma.admin.delete({ where: { id } })
        return res.status(200).json({ ok: true, deleted: true })
      }

      if (existing.role === 'SUPER_ADMIN') {
        const others = await countActiveSuperAdmins(id)
        if (others === 0) {
          return res.status(409).json({ ok: false, error: 'cannot_delete_last_super_admin' })
        }
      }

      const count = await prisma.admin.count({
        where: { passwordSetAt: { not: null }, isActive: true },
      })
      if (count <= 1) {
        return res.status(409).json({ ok: false, error: 'cannot_delete_last_user' })
      }

      await prisma.admin.update({
        where: { id },
        data: { isActive: false },
      })
      return res.status(200).json({ ok: true, deactivated: true })
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ ok: false, error: 'user_not_found' })
      }
      log.errorWithException('Failed to deactivate admin user', error)
      return res.status(500).json({ ok: false, error: 'failed_to_delete_user' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
