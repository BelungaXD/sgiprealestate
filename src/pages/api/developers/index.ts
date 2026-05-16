import type { NextApiRequest, NextApiResponse } from 'next'
import { collectErrorSignals, isDatabaseUnavailableError, prisma } from '@/lib/prisma'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { createScopedLogger } from '@/lib/logger'
import { getAdminSessionFromRequest } from '@/lib/adminSession'
import { adminHasPermission } from '@/lib/adminAuth'
import {
  isMissingDeveloperFounded,
  isMissingDeveloperIsActive,
  isMissingDeveloperLocaleContent,
  isMissingDeveloperLocaleContentColumn,
  isStaleDeveloperLocalePrismaClient,
} from '@/lib/developerPrismaCompat'
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
  name: z.string().optional().nullable(),
  nameRu: z.string().optional().nullable(),
  nameAr: z.string().optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  descriptionRu: z.string().max(20000).optional().nullable(),
  descriptionAr: z.string().max(20000).optional().nullable(),
  website: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional().default([]),
  specialtiesRu: z.array(z.string()).optional().default([]),
  specialtiesAr: z.array(z.string()).optional().default([]),
  notableProjects: z.array(z.string()).optional().default([]),
  notableProjectsRu: z.array(z.string()).optional().default([]),
  notableProjectsAr: z.array(z.string()).optional().default([]),
  founded: z.number().int().min(1000).max(9999).optional().nullable(),
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
  descriptionRu?: string | null
  descriptionAr?: string | null
  city: string | null
  website: string | null
  specialties?: string[]
  notableProjects?: string[]
  founded?: number | null
  isActive?: boolean
  _count: { properties: number }
}

type PropertyGroupByRow = {
  developerId: string | null
  _count: { _all: number }
  _avg: { price: unknown }
}

const developerListSelect = (options: {
  admin: boolean
  includeIsActive: boolean
  includeFounded: boolean
  includeLocaleContent: boolean
}) => {
  const propertiesCountSelect = options.admin
    ? true
    : { where: { isPublished: true } }

  return {
    id: true,
    name: true,
    nameEn: true,
    slug: true,
    logo: true,
    description: true,
    descriptionEn: true,
    ...(options.includeLocaleContent
      ? {
          nameRu: true,
          nameAr: true,
          descriptionRu: true,
          descriptionAr: true,
          specialtiesRu: true,
          specialtiesAr: true,
          notableProjectsRu: true,
          notableProjectsAr: true,
        }
      : {}),
    city: true,
    website: true,
    specialties: true,
    notableProjects: true,
    ...(options.includeFounded ? { founded: true } : {}),
    ...(options.includeIsActive ? { isActive: true } : {}),
    _count: {
      select: {
        properties: propertiesCountSelect,
      },
    },
  } as const
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
            { nameRu: { contains: search, mode: 'insensitive' } },
            { nameAr: { contains: search, mode: 'insensitive' } },
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
      let includesFounded = true
      let includesLocaleContent = true

      const listWhere = (filterActive: boolean) => ({
        AND: admin
          ? baseAndClauses
          : filterActive
            ? [...baseAndClauses, { isActive: true }]
            : baseAndClauses,
      })

      const fetchDevelopers = (
        includeIsActive: boolean,
        includeFounded: boolean,
        includeLocaleContent: boolean,
        filterActive: boolean
      ) =>
        prisma.developer.findMany({
          where: listWhere(filterActive),
          select: developerListSelect({
            admin,
            includeIsActive,
            includeFounded,
            includeLocaleContent,
          }),
          orderBy,
        })

      let developers: DeveloperListRow[] = []
      let filterActive = true
      let fetchOk = false
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          developers = (await fetchDevelopers(
            includesIsActive,
            includesFounded,
            includesLocaleContent,
            filterActive
          )) as DeveloperListRow[]
          fetchOk = true
          break
        } catch (error: unknown) {
          const missingFounded = isMissingDeveloperFounded(error)
          const missingIsActive = isMissingDeveloperIsActive(error)
          const missingLocale = isMissingDeveloperLocaleContent(error)

          if (missingLocale && includesLocaleContent) {
            includesLocaleContent = false
            continue
          }
          if (missingFounded && includesFounded) {
            includesFounded = false
            continue
          }
          if (missingIsActive && includesIsActive) {
            includesIsActive = false
            filterActive = false
            continue
          }
          if (missingFounded || missingIsActive || missingLocale) {
            includesFounded = false
            includesIsActive = false
            includesLocaleContent = false
            filterActive = false
            continue
          }
          throw error
        }
      }
      if (!fetchOk) {
        developers = []
      }

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
        specialtiesRu: includesLocaleContent && Array.isArray(dev.specialtiesRu) ? dev.specialtiesRu : [],
        specialtiesAr: includesLocaleContent && Array.isArray(dev.specialtiesAr) ? dev.specialtiesAr : [],
        notableProjects: Array.isArray(dev.notableProjects) ? dev.notableProjects : [],
        notableProjectsRu:
          includesLocaleContent && Array.isArray(dev.notableProjectsRu) ? dev.notableProjectsRu : [],
        notableProjectsAr:
          includesLocaleContent && Array.isArray(dev.notableProjectsAr) ? dev.notableProjectsAr : [],
        nameRu:
          includesLocaleContent && 'nameRu' in dev
            ? (dev as { nameRu?: string | null }).nameRu
            : null,
        nameAr:
          includesLocaleContent && 'nameAr' in dev
            ? (dev as { nameAr?: string | null }).nameAr
            : null,
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
    const session = getAdminSessionFromRequest(req)
    if (!session || !adminHasPermission(session.role, 'manage_developers')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = createDeveloperSchema.parse(body)
      const name = parsed.name?.trim() || ''
      const nameRu = parsed.nameRu?.trim() || ''
      const nameAr = parsed.nameAr?.trim() || ''
      const primaryName = name || nameRu || nameAr
      if (!primaryName) {
        return res.status(400).json({ success: false, message: 'Name is required' })
      }
      const storedName = name || primaryName
      const nameEn = storedName
      let slug = generateSlug(name || nameRu || nameAr)
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

      const baseCreateData = {
        name: storedName,
        nameEn,
        description: parsed.description?.trim() || null,
        descriptionEn: parsed.description?.trim() || null,
        specialties: parsed.specialties.map((v) => v.trim()).filter(Boolean),
        notableProjects: parsed.notableProjects.map((v) => v.trim()).filter(Boolean),
        logo: parsed.logo || null,
        website,
        slug,
      }

      const localeCreateData = {
        nameRu: nameRu || null,
        nameAr: nameAr || null,
        descriptionRu: parsed.descriptionRu?.trim() || null,
        descriptionAr: parsed.descriptionAr?.trim() || null,
        specialtiesRu: parsed.specialtiesRu.map((v) => v.trim()).filter(Boolean),
        specialtiesAr: parsed.specialtiesAr.map((v) => v.trim()).filter(Boolean),
        notableProjectsRu: parsed.notableProjectsRu.map((v) => v.trim()).filter(Boolean),
        notableProjectsAr: parsed.notableProjectsAr.map((v) => v.trim()).filter(Boolean),
      }

      let includeFounded = true
      let includeIsActive = true
      let includeLocaleContent = true
      let localeContentSaved = true
      let developer: Awaited<ReturnType<typeof prisma.developer.create>> | undefined

      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          developer = await prisma.developer.create({
            data: {
              ...baseCreateData,
              ...(includeLocaleContent ? localeCreateData : {}),
              ...(includeFounded && { founded: parsed.founded ?? null }),
              ...(includeIsActive && { isActive: parsed.isActive ?? true }),
            },
          })
          break
        } catch (error: unknown) {
          if (isStaleDeveloperLocalePrismaClient(error)) {
            return res.status(503).json({
              message:
                'Prisma client is out of date. Run npm run db:generate and restart the application.',
            })
          }
          const missingFounded = isMissingDeveloperFounded(error)
          const missingIsActive = isMissingDeveloperIsActive(error)
          const missingLocale = isMissingDeveloperLocaleContentColumn(error)
          if (missingLocale && includeLocaleContent) {
            includeLocaleContent = false
            localeContentSaved = false
            continue
          }
          if (missingFounded && includeFounded) {
            includeFounded = false
            continue
          }
          if (missingIsActive && includeIsActive) {
            includeIsActive = false
            continue
          }
          if (missingFounded || missingIsActive || missingLocale) {
            includeFounded = false
            includeIsActive = false
            if (missingLocale) localeContentSaved = false
            includeLocaleContent = false
            continue
          }
          throw error
        }
      }

      if (!developer) {
        return res.status(500).json({ message: 'Failed to create developer' })
      }

      return res.status(201).json({ success: true, developer, localeContentSaved })
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
