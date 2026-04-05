import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { z } from 'zod'

const updateAreaSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameRu: z.string().optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  city: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional(),
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
      const existing = await prisma.area.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ message: 'Area not found' })

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updateAreaSchema.parse(body)

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
            const ex = await prisma.area.findFirst({
              where: { slug: s, NOT: { id } },
            })
            return !!ex
          })
        }
      }

      const area = await prisma.area.update({
        where: { id },
        data: {
          name,
          nameEn: nameEn,
          ...(parsed.description !== undefined && {
            description: parsed.description?.trim() || null,
          }),
          ...(parsed.city !== undefined && {
            city: parsed.city?.trim() || existing.city,
          }),
          ...(parsed.image !== undefined && { image: parsed.image || null }),
          ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
          ...(parsed.sortOrder !== undefined && { sortOrder: parsed.sortOrder }),
          ...(parsed.tags !== undefined && { tags: parsed.tags }),
          slug,
        },
      })

      return res.status(200).json({ success: true, area })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors })
      }
      console.error('Error updating area:', error)
      return res.status(500).json({ message: error.message || 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const force = req.query.force === '1'
      const linked = await prisma.property.count({ where: { areaId: id } })
      if (linked > 0 && !force) {
        return res.status(409).json({
          success: false,
          code: 'HAS_LINKED_PROPERTIES',
          linkedProperties: linked,
          message: `${linked} listing(s) use this area.`,
        })
      }
      if (linked > 0 && force) {
        await prisma.property.updateMany({
          where: { areaId: id },
          data: { areaId: null },
        })
      }
      await prisma.area.delete({ where: { id } })
      return res.status(200).json({ success: true })
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Area not found' })
      }
      console.error('Error deleting area:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
