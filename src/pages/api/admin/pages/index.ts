import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ADMIN_SESSION_COOKIE, readCookie, verifyAdminSessionToken } from '@/lib/adminSession'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/pages')

const createPageSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50000).optional().nullable(),
  isPublished: z.boolean().optional().default(true),
})

function isAuthorized(req: NextApiRequest): boolean {
  const token = readCookie(req, ADMIN_SESSION_COOKIE)
  return verifyAdminSessionToken(token)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const pages = await prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } })
      return res.status(200).json({ ok: true, pages })
    } catch (error) {
      log.errorWithException('Failed to load pages', error)
      return res.status(500).json({ ok: false, error: 'failed_to_load_pages' })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = createPageSchema.parse(body)
      const page = await prisma.cmsPage.create({
        data: {
          slug: parsed.slug.toLowerCase(),
          title: parsed.title,
          content: parsed.content?.trim() || null,
          isPublished: parsed.isPublished,
        },
      })
      return res.status(201).json({ ok: true, page })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: 'invalid_payload', issues: error.issues })
      }
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ ok: false, error: 'slug_already_exists' })
      }
      log.errorWithException('Failed to create page', error)
      return res.status(500).json({ ok: false, error: 'failed_to_create_page' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
