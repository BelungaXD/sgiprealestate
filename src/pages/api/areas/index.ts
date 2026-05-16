import type { NextApiRequest, NextApiResponse } from 'next'
import { isDatabaseUnavailableError, prisma } from '@/lib/prisma'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'
import { createScopedLogger } from '@/lib/logger'
import { isAdminSessionValid } from '@/lib/adminSession'
import { validateAreaParent, type AreaHierarchyError } from '@/lib/areas/hierarchy'
import { isMissingAreaLocaleContent } from '@/lib/areaPrismaCompat'
import { z } from 'zod'

const areaImageInput = z.object({
  url: z.string().min(1),
  alt: z.string().optional().nullable(),
  order: z.number().int().optional(),
  isMain: z.boolean().optional(),
})

const createAreaSchema = z.object({
  name: z.string().optional().nullable(),
  nameRu: z.string().optional().nullable(),
  nameAr: z.string().optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  descriptionRu: z.string().max(10000).optional().nullable(),
  descriptionAr: z.string().max(10000).optional().nullable(),
  city: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  tagsRu: z.array(z.string()).optional().default([]),
  tagsAr: z.array(z.string()).optional().default([]),
  parentId: z.string().min(1).optional().nullable(),
  mapEmbed: z.string().max(2000).optional().nullable(),
  images: z.array(areaImageInput).max(30).optional(),
})

const HIERARCHY_ERROR_MESSAGES: Record<AreaHierarchyError, string> = {
  self_parent: 'Area cannot be its own parent.',
  parent_not_found: 'Parent area not found.',
  cycle_detected: 'Parent assignment would create a cycle.',
  max_depth_exceeded: 'Areas support at most 3 levels (City → District → Sub-district).',
}

const hasMissingAreaIsActiveColumn = (error: unknown) => {
  if (!error || typeof error !== 'object') return false

  const prismaError = error as {
    code?: string
    meta?: { column?: string }
    message?: string
  }

  return (
    prismaError.code === 'P2022' &&
    (prismaError.meta?.column === 'areas.isActive' ||
      prismaError.message?.includes('areas.isActive'))
  )
}

const log = createScopedLogger('api/areas')

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
          { nameRu: { contains: search, mode: 'insensitive' } },
          { nameAr: { contains: search, mode: 'insensitive' } },
        ]
      }

      let orderBy: { sortOrder?: 'asc' | 'desc'; name?: 'asc' | 'desc' }[] | { name: 'asc' } = {
        name: 'asc',
      }
      if (sort === 'sortOrder') {
        orderBy = [{ sortOrder: 'asc' }, { name: 'asc' }]
      }

      let includesIsActive = true
      let includesLocaleContent = true

      const fetchAreas = (filterActive: boolean, withLocale: boolean) => {
        const listWhere = { ...where }
        if (!filterActive && 'isActive' in listWhere) {
          delete listWhere.isActive
        }
        return prisma.area.findMany({
          where: listWhere,
          orderBy,
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            description: true,
            descriptionEn: true,
            ...(withLocale
              ? {
                  nameRu: true,
                  nameAr: true,
                  descriptionRu: true,
                  descriptionAr: true,
                  tagsRu: true,
                  tagsAr: true,
                }
              : {}),
            city: true,
            image: true,
            sortOrder: true,
            tags: true,
            parentId: true,
            mapEmbed: true,
            ...(includesIsActive ? { isActive: true } : {}),
            images: { orderBy: [{ isMain: 'desc' as const }, { order: 'asc' as const }] },
            _count: { select: { properties: true } },
          },
        })
      }

      let filterActive = true
      let areas: Awaited<ReturnType<typeof fetchAreas>> = []
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          areas = await fetchAreas(filterActive, includesLocaleContent)
          break
        } catch (error: unknown) {
          const missingLocale = isMissingAreaLocaleContent(error)
          const missingIsActive = hasMissingAreaIsActiveColumn(error)
          if (missingLocale && includesLocaleContent) {
            includesLocaleContent = false
            continue
          }
          if (missingIsActive && includesIsActive) {
            includesIsActive = false
            filterActive = false
            continue
          }
          if (missingLocale || missingIsActive) {
            includesLocaleContent = false
            includesIsActive = false
            filterActive = false
            continue
          }
          throw error
        }
      }

      const mapped = areas.map((a: (typeof areas)[number]) => ({
        ...a,
        isActive: includesIsActive
          ? (a as { isActive?: boolean }).isActive ?? true
          : true,
        image: a.image ? normalizeImageUrl(a.image) : null,
        images: (a.images || []).map((img: { url: string; [k: string]: unknown }) => ({
          ...img,
          url: normalizeImageUrl(img.url) || img.url,
        })),
        linkedProperties: a._count.properties,
        tagsRu: includesLocaleContent && Array.isArray(a.tagsRu) ? a.tagsRu : [],
        tagsAr: includesLocaleContent && Array.isArray(a.tagsAr) ? a.tagsAr : [],
        descriptionRu:
          includesLocaleContent && 'descriptionRu' in a
            ? (a as { descriptionRu?: string | null }).descriptionRu
            : null,
        descriptionAr:
          includesLocaleContent && 'descriptionAr' in a
            ? (a as { descriptionAr?: string | null }).descriptionAr
            : null,
        nameRu:
          includesLocaleContent && 'nameRu' in a
            ? (a as { nameRu?: string | null }).nameRu
            : null,
        nameAr:
          includesLocaleContent && 'nameAr' in a
            ? (a as { nameAr?: string | null }).nameAr
            : null,
      }))

      return res.status(200).json({ areas: mapped })
    } catch (error: unknown) {
      log.errorWithException('Error fetching areas', error)
      if (isDatabaseUnavailableError(error)) {
        return res.status(200).json({ areas: [] })
      }
      const message = error instanceof Error ? error.message : ''
      return res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? message || 'Unknown error' : undefined,
      })
    }
  }

  if (req.method === 'POST') {
    if (!isAdminSessionValid(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = createAreaSchema.parse(body)
      const city = parsed.city?.trim() || 'Dubai'
      const name = parsed.name?.trim() || ''
      const nameRu = parsed.nameRu?.trim() || ''
      const nameAr = parsed.nameAr?.trim() || ''
      const primaryName = name || nameRu || nameAr
      if (!primaryName) {
        return res.status(400).json({ success: false, message: 'Name is required' })
      }
      const storedName = name || primaryName
      const nameEnField = storedName

      const parentId = parsed.parentId?.trim() || null
      if (parentId) {
        const hierarchyError = await validateAreaParent(
          prisma as unknown as Parameters<typeof validateAreaParent>[0],
          parentId
        )
        if (hierarchyError) {
          return res.status(400).json({
            success: false,
            code: hierarchyError,
            message: HIERARCHY_ERROR_MESSAGES[hierarchyError],
          })
        }
      }

      let slug = generateSlug(name || nameRu || nameAr)
      slug = await generateUniqueSlug(slug, async (s) => {
        const ex = await prisma.area.findUnique({ where: { slug: s } })
        return !!ex
      })

      const baseData = {
        name: storedName,
        nameEn: nameEnField,
        description: parsed.description?.trim() || null,
        city,
        slug,
        image: parsed.image || null,
        sortOrder: parsed.sortOrder ?? null,
        tags: parsed.tags || [],
        parentId,
        mapEmbed: parsed.mapEmbed?.trim() || null,
      }

      const localeCreateData = {
        nameRu: nameRu || null,
        nameAr: nameAr || null,
        descriptionRu: parsed.descriptionRu?.trim() || null,
        descriptionAr: parsed.descriptionAr?.trim() || null,
        tagsRu: parsed.tagsRu.map((v) => v.trim()).filter(Boolean),
        tagsAr: parsed.tagsAr.map((v) => v.trim()).filter(Boolean),
      }

      let includeIsActive = true
      let includeLocaleContent = true
      let area: Awaited<ReturnType<typeof prisma.area.create>> | undefined

      const imageCreate =
        parsed.images && parsed.images.length > 0
          ? {
              images: {
                create: parsed.images.map((img, idx) => ({
                  url: img.url,
                  alt: img.alt || null,
                  order: img.order ?? idx,
                  isMain: !!img.isMain,
                })),
              },
            }
          : {}

      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          area = await prisma.area.create({
            data: {
              ...baseData,
              ...(includeLocaleContent ? localeCreateData : {}),
              ...(includeIsActive ? { isActive: parsed.isActive ?? true } : {}),
              ...imageCreate,
            },
            include: { images: true },
          })
          break
        } catch (error: unknown) {
          const missingLocale = isMissingAreaLocaleContent(error)
          const missingIsActive = hasMissingAreaIsActiveColumn(error)
          if (missingLocale && includeLocaleContent) {
            includeLocaleContent = false
            continue
          }
          if (missingIsActive && includeIsActive) {
            includeIsActive = false
            continue
          }
          if (missingLocale || missingIsActive) {
            includeLocaleContent = false
            includeIsActive = false
            continue
          }
          throw error
        }
      }

      if (!area) {
        return res.status(500).json({ message: 'Failed to create area' })
      }

      return res.status(201).json({ success: true, area })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.issues })
      }
      log.errorWithException('Error creating area', error)
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Internal server error',
      })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
