import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ADMIN_SESSION_COOKIE, readCookie, verifyAdminSessionToken } from '@/lib/adminSession'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/inquiries/[id]')

const updateInquirySchema = z.object({
  status: z
    .enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'])
    .optional(),
  notes: z.string().max(5000).optional().nullable(),
})

function isAuthorized(req: NextApiRequest): boolean {
  const token = readCookie(req, ADMIN_SESSION_COOKIE)
  return verifyAdminSessionToken(token)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }
  const id = req.query.id
  if (typeof id !== 'string' || !id.trim()) {
    return res.status(400).json({ ok: false, error: 'invalid_inquiry_id' })
  }

  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updateInquirySchema.parse(body)
      const inquiry = await prisma.lead.update({
        where: { id },
        data: {
          ...(parsed.status && { status: parsed.status }),
          ...(parsed.notes !== undefined && { notes: parsed.notes?.trim() || null }),
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
    try {
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
