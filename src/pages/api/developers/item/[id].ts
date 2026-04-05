import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { z } from 'zod'

const updateDeveloperSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameRu: z.string().optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  website: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid id' })
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ message: 'Database not configured' })
  }

  if (req.method === 'PUT') {
    try {
      const existing = await prisma.developer.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ message: 'Developer not found' })

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updateDeveloperSchema.parse(body)

      let nameEn = existing.nameEn || existing.name
      let name = existing.name

      if (parsed.nameEn !== undefined) {
        nameEn = parsed.nameEn.trim()
      }
      if (parsed.nameRu !== undefined) {
        name = (parsed.nameRu?.trim() || '') || nameEn
      } else if (parsed.nameEn !== undefined) {
        const hadDistinctRu =
          !!existing.name &&
          !!existing.nameEn &&
          existing.name !== existing.nameEn
        name = hadDistinctRu ? existing.name : nameEn
      }

      let slug = existing.slug
      if (parsed.nameEn !== undefined) {
        const prevEn = (existing.nameEn || existing.name).trim()
        if (nameEn !== prevEn) {
          const base = generateSlug(nameEn)
          slug = await generateUniqueSlug(base, async (s) => {
            const ex = await prisma.developer.findFirst({
              where: { slug: s, NOT: { id } },
            })
            return !!ex
          })
        }
      }

      const website =
        parsed.website !== undefined
          ? parsed.website && parsed.website.trim() !== ''
            ? parsed.website.trim()
            : null
          : undefined

      const developer = await prisma.developer.update({
        where: { id },
        data: {
          name,
          nameEn,
          ...(parsed.description !== undefined && {
            description: parsed.description?.trim() || null,
          }),
          ...(parsed.logo !== undefined && { logo: parsed.logo || null }),
          ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
          ...(website !== undefined && { website }),
          slug,
        },
      })

      return res.status(200).json({ success: true, developer })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors })
      }
      console.error('Error updating developer:', error)
      return res.status(500).json({ message: error.message || 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const force = req.query.force === '1'
      const linked = await prisma.property.count({ where: { developerId: id } })
      if (linked > 0 && !force) {
        return res.status(409).json({
          success: false,
          code: 'HAS_LINKED_PROPERTIES',
          linkedProperties: linked,
          message: `${linked} listing(s) reference this developer.`,
        })
      }
      if (linked > 0 && force) {
        await prisma.property.updateMany({
          where: { developerId: id },
          data: { developerId: null },
        })
      }
      await prisma.developer.delete({ where: { id } })
      return res.status(200).json({ success: true })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Developer not found' })
      }
      console.error('Error deleting developer:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
