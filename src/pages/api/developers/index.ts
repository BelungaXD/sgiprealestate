import type { NextApiRequest, NextApiResponse } from 'next'
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { createScopedLogger } from '@/lib/logger'
import { isAdminSessionValid } from '@/lib/adminSession'
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
  specialties: z.array(z.string()).optional().default([]),
  notableProjects: z.array(z.string()).optional().default([]),
  logo: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

/** Row shape from `developer.findMany` with the selects used in this handler (incl. fallback without `isActive`). */
type DeveloperListRow = {
  id: string
  name: string
  nameEn: string | null
  slug: string
  logo: string | null
  description: string | null
  descriptionEn: string | null
  city: string | null
  website: string | null
  specialties?: string[]
  notableProjects?: string[]
  isActive?: boolean
  _count: { properties: number }
}

type PropertyGroupByRow = {
  developerId: string | null
  _count: { _all: number }
  _avg: { price: unknown }
}

const hasMissingDeveloperIsActiveColumn = (error: unknown) => {
  if (!error || typeof error !== 'object') return false

  const prismaError = error as {
    code?: string
    meta?: { column?: string }
    message?: string
  }

  return (
    prismaError.code === 'P2022' &&
    (prismaError.meta?.column === 'developers.isActive' ||
      prismaError.message?.includes('developers.isActive'))
  )
}

const log = createScopedLogger('api/developers')

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

      const baseAndClauses: object[] = [emaarNoiseFilter]
      if (search) {
        baseAndClauses.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { nameEn: { contains: search, mode: 'insensitive' } },
          ],
        })
      }

      const orderBy =
        sort === 'properties'
          ? undefined
          : {
              name: 'asc' as const,
            }

      let includesIsActive = true
      const developers = (await prisma.developer
        .findMany({
          where: {
            AND: admin
              ? baseAndClauses
              : [...baseAndClauses, { isActive: true }],
          },
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
            specialties: true,
            notableProjects: true,
            isActive: true,
            _count: {
              select: {
                properties: admin
                  ? true
                  : {
                      where: { isPublished: true },
                    },
              },
            },
          },
          orderBy,
        })
        .catch(async (error: unknown) => {
          if (!hasMissingDeveloperIsActiveColumn(error)) {
            throw error
          }

          includesIsActive = false
          return prisma.developer.findMany({
            where: { AND: baseAndClauses },
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
              specialties: true,
              notableProjects: true,
              _count: {
                select: {
                  properties: admin
                    ? true
                    : {
                        where: { isPublished: true },
                      },
                },
              },
            },
            orderBy,
          })
        })) as DeveloperListRow[]

      const developerIds = developers.map((dev) => dev.id)
      const propertyWhere = admin ? {} : { isPublished: true }
      const propertyStats: PropertyGroupByRow[] = developerIds.length
        ? await prisma.property.groupBy({
            by: ['developerId'],
            where: {
              ...propertyWhere,
              developerId: { in: developerIds },
            },
            _count: { _all: true },
            _avg: { price: true },
          })
        : []
      const statsByDeveloperId = new Map<string, { count: number; avgPrice: number }>(
        propertyStats
          .filter((row): row is PropertyGroupByRow & { developerId: string } => row.developerId != null)
          .map((row) => [
            row.developerId,
            {
              count: row._count._all,
              avgPrice: row._avg.price ? Number(row._avg.price) : 0,
            },
          ])
      )
      const totalProperties = propertyStats.reduce(
        (sum: number, row: PropertyGroupByRow) => sum + row._count._all,
        0
      )

      let list = developers.map((dev: DeveloperListRow) => ({
        ...dev,
        isActive: includesIsActive
          ? (dev as { isActive?: boolean }).isActive ?? true
          : true,
        logo: normalizeImageUrl(dev.logo),
        specialties: Array.isArray(dev.specialties) ? dev.specialties : [],
        notableProjects: Array.isArray(dev.notableProjects) ? dev.notableProjects : [],
        propertiesCount: statsByDeveloperId.get(dev.id)?.count ?? dev._count.properties,
        averagePrice: statsByDeveloperId.get(dev.id)?.avgPrice ?? 0,
        marketShare:
          totalProperties > 0
            ? Number((((statsByDeveloperId.get(dev.id)?.count ?? dev._count.properties) / totalProperties) * 100).toFixed(1))
            : 0,
      }))

      if (sort === 'properties') {
        list = [...list].sort((a, b) => b.propertiesCount - a.propertiesCount)
      }

      return res.status(200).json({ developers: list })
    } catch (error: unknown) {
      const { codes, messages } = collectErrorSignals(error)
      log.errorWithException('Error fetching developers', error)
      if (process.env.NODE_ENV !== 'production') {
        log.warn('Developers fetch DB error signals', {
          codes: Array.from(codes),
          messages: Array.from(messages),
        })
      }
      if (isDatabaseUnavailableError(error)) {
        return res.status(200).json({ developers: [] })
      }
      const message = error instanceof Error ? error.message : ''
      return res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message || undefined : undefined,
      })
    }
  }

  if (req.method === 'POST') {
    if (!isAdminSessionValid(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = createDeveloperSchema.parse(body)
      const nameEn = parsed.nameEn.trim()
      const nameRu = parsed.nameRu?.trim() || ''
      const name = nameRu || nameEn
      let slug = generateSlug(nameEn)
      if (!slug) {
        slug = `developer-${Date.now()}`
      }
      slug = await generateUniqueSlug(slug, async (s) => {
        const ex = await prisma.developer.findFirst({
          where: { slug: s },
          select: { id: true },
        })
        return !!ex
      })

      const website =
        parsed.website && parsed.website.trim() !== '' ? parsed.website.trim() : null

      const developer = await prisma.developer
        .create({
          data: {
            name,
            nameEn,
            description: parsed.description?.trim() || null,
            specialties: parsed.specialties.map((v) => v.trim()).filter(Boolean),
            notableProjects: parsed.notableProjects.map((v) => v.trim()).filter(Boolean),
            logo: parsed.logo || null,
            website,
            isActive: parsed.isActive ?? true,
            slug,
          },
        })
        .catch(async (error: unknown) => {
          if (!hasMissingDeveloperIsActiveColumn(error)) {
            throw error
          }

          return prisma.developer.create({
            data: {
              name,
              nameEn,
              description: parsed.description?.trim() || null,
              specialties: parsed.specialties.map((v) => v.trim()).filter(Boolean),
              notableProjects: parsed.notableProjects.map((v) => v.trim()).filter(Boolean),
              logo: parsed.logo || null,
              website,
              slug,
            },
          })
        })

      return res.status(201).json({ success: true, developer })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.issues })
      }
      const { codes, messages } = collectErrorSignals(error)
      log.errorWithException('Error creating developer', error)
      if (process.env.NODE_ENV !== 'production') {
        log.warn('Create developer DB error signals', {
          codes: Array.from(codes),
          messages: Array.from(messages),
        })
      }
      if (isDatabaseUnavailableError(error)) {
        return res.status(503).json({
          message: 'Database is unavailable. Start PostgreSQL and retry.',
        })
      }
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Internal server error',
      })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
