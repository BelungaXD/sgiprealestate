import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'
import { z } from 'zod'

const createAreaSchema = z.object({
  nameEn: z.string().min(1, 'Name (EN) is required'),
  nameRu: z.string().optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  city: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.DATABASE_URL) {
    if (req.method === 'GET') return res.status(200).json({ areas: [] })
    return res.status(503).json({ message: 'Database not configured' })
  }

  if (req.method === 'GET') {
    try {
      const admin = req.query.admin === '1'
      const search = (req.query.search as string)?.trim()
      const sort = req.query.sort as string | undefined
      const activeOnly = req.query.activeOnly !== '0' && !admin

      const where: Record<string, unknown> = {}
      if (activeOnly) where.isActive = true
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { nameEn: { contains: search, mode: 'insensitive' } },
        ]
      }

      let orderBy: { sortOrder?: 'asc' | 'desc'; name?: 'asc' | 'desc' }[] | { name: 'asc' } = {
        name: 'asc',
      }
      if (sort === 'sortOrder') {
        orderBy = [{ sortOrder: 'asc' }, { name: 'asc' }]
      }

      const areas = await prisma.area.findMany({
        where,
        orderBy,
        include: {
          _count: { select: { properties: true } },
        },
      })

      const mapped = areas.map((a: (typeof areas)[number]) => ({
        ...a,
        image: a.image ? normalizeImageUrl(a.image) : null,
        linkedProperties: a._count.properties,
      }))

      return res.status(200).json({ areas: mapped })
    } catch (error: any) {
      console.error('Error fetching areas:', error)
      if (
        error.code === 'P1001' ||
        error.message?.includes('DATABASE_URL') ||
        error.message?.includes('Can\'t reach database')
      ) {
        return res.status(200).json({ areas: [] })
      }
      return res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = createAreaSchema.parse(body)
      const city = parsed.city?.trim() || 'Dubai'
      const nameRu = parsed.nameRu?.trim() || ''
      const nameEn = parsed.nameEn.trim()
      const name = nameRu || nameEn
      const nameEnField = nameEn

      let slug = generateSlug(nameEn)
      slug = await generateUniqueSlug(slug, async (s) => {
        const ex = await prisma.area.findUnique({ where: { slug: s } })
        return !!ex
      })

      const area = await prisma.area.create({
        data: {
          name,
          nameEn: nameEnField,
          description: parsed.description?.trim() || null,
          city,
          slug,
          image: parsed.image || null,
          isActive: parsed.isActive ?? true,
          sortOrder: parsed.sortOrder ?? null,
          tags: parsed.tags || [],
        },
      })

      return res.status(201).json({ success: true, area })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors })
      }
      console.error('Error creating area:', error)
      return res.status(500).json({ message: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
