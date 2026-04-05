import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { z } from 'zod'

const emaarNoiseFilter = {
  NOT: [
    {
      AND: [
        {
          OR: [
            { name: { contains: 'Emaar', mode: 'insensitive' as const } },
            { nameEn: { contains: 'Emaar', mode: 'insensitive' as const } },
            { slug: { contains: 'emaar', mode: 'insensitive' as const } },
          ],
        },
        {
          NOT: [
            { name: { contains: 'Emaar Properties', mode: 'insensitive' as const } },
            { nameEn: { contains: 'Emaar Properties', mode: 'insensitive' as const } },
            { slug: { contains: 'emaar-properties', mode: 'insensitive' as const } },
          ],
        },
      ],
    },
  ],
}

const createDeveloperSchema = z.object({
  nameEn: z.string().min(1, 'Name (EN) is required'),
  nameRu: z.string().optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  website: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.DATABASE_URL) {
    if (req.method === 'GET') return res.status(200).json({ developers: [] })
    return res.status(503).json({ message: 'Database not configured' })
  }

  if (req.method === 'GET') {
    try {
      const admin = req.query.admin === '1'
      const search = (req.query.search as string)?.trim()
      const sort = req.query.sort as string | undefined

      const andClauses: object[] = [emaarNoiseFilter]
      if (!admin) {
        andClauses.push({ isActive: true })
      }
      if (search) {
        andClauses.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
          ],
        })
      }

      const developers = await prisma.developer.findMany({
        where: { AND: andClauses },
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
          logo: true,
          description: true,
          descriptionEn: true,
          city: true,
          website: true,
          isActive: true,
          _count: {
            select: {
              properties: {
                where: { isPublished: true },
              },
            },
          },
        },
        orderBy:
          sort === 'properties'
            ? undefined
            : {
                name: 'asc',
              },
      })

      let list = developers.map((dev: (typeof developers)[number]) => ({
        ...dev,
        logo: normalizeImageUrl(dev.logo),
        propertiesCount: dev._count.properties,
      }))

      if (sort === 'properties') {
        list = [...list].sort((a, b) => b.propertiesCount - a.propertiesCount)
      }

      return res.status(200).json({ developers: list })
    } catch (error: any) {
      console.error('Error fetching developers:', error)
      if (
        error.code === 'P1001' ||
        error.message?.includes('DATABASE_URL') ||
        error.message?.includes('Can\'t reach database')
      ) {
        return res.status(200).json({ developers: [] })
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
      const parsed = createDeveloperSchema.parse(body)
      const nameEn = parsed.nameEn.trim()
      const nameRu = parsed.nameRu?.trim() || ''
      const name = nameRu || nameEn
      let slug = generateSlug(nameEn)
      slug = await generateUniqueSlug(slug, async (s) => {
        const ex = await prisma.developer.findUnique({ where: { slug: s } })
        return !!ex
      })

      const website =
        parsed.website && parsed.website.trim() !== '' ? parsed.website.trim() : null

      const developer = await prisma.developer.create({
        data: {
          name,
          nameEn,
          description: parsed.description?.trim() || null,
          logo: parsed.logo || null,
          website,
          isActive: parsed.isActive ?? true,
          slug,
        },
      })

      return res.status(201).json({ success: true, developer })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: error.errors })
      }
      console.error('Error creating developer:', error)
      return res.status(500).json({ message: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
