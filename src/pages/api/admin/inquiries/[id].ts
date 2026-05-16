import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createScopedLogger } from '@/lib/logger'
import { adminHasPermission, managerLeadScope, requireAdminSession, type AdminSession } from '@/lib/adminAuth'

const log = createScopedLogger('api/admin/inquiries/[id]')

const updateInquirySchema = z.object({
  status: z
    .enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'])
    .optional(),
  notes: z.string().max(5000).optional().nullable(),
  assignedAdminId: z.string().nullable().optional(),
})

async function findLeadForSession(session: AdminSession, id: string) {
  const scope = managerLeadScope(session)
  return prisma.lead.findFirst({
    where: {
      id,
      ...(scope ? { assignedAdminId: scope.assignedAdminId } : {}),
    },
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'view_inquiries' })
  if (!session) return

  const id = req.query.id
  if (typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ ok: false, error: 'invalid_inquiry_id' })
  }

  if (req.method === 'PATCH') {
    if (!adminHasPermission(session.role, 'manage_inquiries')) {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }

    try {
      const existing = await findLeadForSession(session, id)
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'inquiry_not_found' })
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updateInquirySchema.parse(body)

      if (parsed.assignedAdminId !== undefined && session.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ ok: false, error: 'forbidden' })
      }

      const inquiry = await prisma.lead.update({
        where: { id },
        data: {
          ...(parsed.status && { status: parsed.status }),
          ...(parsed.notes !== undefined && { notes: parsed.notes?.trim() || null }),
          ...(parsed.assignedAdminId !== undefined && {
            assignedAdminId: parsed.assignedAdminId,
          }),
        },
      })
      return res.status(200).json({ ok: true, inquiry })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: 'invalid_payload', issues: error.issues })
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ ok: false, error: 'inquiry_not_found' })
      }
      log.errorWithException('Failed to update inquiry', error)
      return res.status(500).json({ ok: false, error: 'failed_to_update_inquiry' })
    }
  }

  if (req.method === 'DELETE') {
    if (!adminHasPermission(session.role, 'manage_inquiries') || session.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }

    try {
      const existing = await findLeadForSession(session, id)
      if (!existing) {
        return res.status(404).json({ ok: false, error: 'inquiry_not_found' })
      }

      await prisma.lead.delete({ where: { id } })
      return res.status(200).json({ ok: true })
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ ok: false, error: 'inquiry_not_found' })
      }
      log.errorWithException('Failed to delete inquiry', error)
      return res.status(500).json({ ok: false, error: 'failed_to_delete_inquiry' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
