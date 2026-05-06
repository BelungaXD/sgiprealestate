import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ADMIN_SESSION_COOKIE, readCookie, verifyAdminSessionToken } from '@/lib/adminSession'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/pages/[id]')

const updatePageSchema = z.object({
  slug: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(50000).optional().nullable(),
  isPublished: z.boolean().optional(),
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
    return res.status(400).json({ ok: false, error: 'invalid_page_id' })
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updatePageSchema.parse(body)
      const page = await prisma.cmsPage.update({
        where: { id },
        data: {
          ...(parsed.slug !== undefined && { slug: parsed.slug.toLowerCase() }),
          ...(parsed.title !== undefined && { title: parsed.title }),
          ...(parsed.content !== undefined && { content: parsed.content?.trim() || null }),
          ...(parsed.isPublished !== undefined && { isPublished: parsed.isPublished }),
        },
      })
      return res.status(200).json({ ok: true, page })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: 'invalid_payload', issues: error.issues })
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ ok: false, error: 'slug_already_exists' })
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ ok: false, error: 'page_not_found' })
      }
      log.errorWithException('Failed to update page', error)
      return res.status(500).json({ ok: false, error: 'failed_to_update_page' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.cmsPage.delete({ where: { id } })
      return res.status(200).json({ ok: true })
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ ok: false, error: 'page_not_found' })
      }
      log.errorWithException('Failed to delete page', error)
      return res.status(500).json({ ok: false, error: 'failed_to_delete_page' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
