import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
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

const updateAreaSchema = z.object({
  name: z.string().optional().nullable(),
  nameRu: z.string().optional().nullable(),
  nameAr: z.string().optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  descriptionRu: z.string().max(10000).optional().nullable(),
  descriptionAr: z.string().max(10000).optional().nullable(),
  city: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional().nullable(),
  tags: z.array(z.string()).optional(),
  tagsRu: z.array(z.string()).optional(),
  tagsAr: z.array(z.string()).optional(),
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

const log = createScopedLogger('api/areas/item/[id]')

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

  if (!isAdminSessionValid(req)) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method === 'PUT') {
    try {
      const existing = await prisma.area.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ message: 'Area not found' })

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updateAreaSchema.parse(body)

      let name = existing.name
      let nameEn = existing.nameEn || existing.name
      let nameRu: string | null = (existing as { nameRu?: string | null }).nameRu ?? null
      let nameAr: string | null = (existing as { nameAr?: string | null }).nameAr ?? null

      if (
        parsed.name !== undefined ||
        parsed.nameRu !== undefined ||
        parsed.nameAr !== undefined
      ) {
        const nextName =
          parsed.name !== undefined ? parsed.name?.trim() || '' : name
        const nextRu =
          parsed.nameRu !== undefined
            ? parsed.nameRu?.trim() || ''
            : (nameRu ?? '').trim()
        const nextAr =
          parsed.nameAr !== undefined
            ? parsed.nameAr?.trim() || ''
            : (nameAr ?? '').trim()
        const primary = nextName || nextRu || nextAr
        if (!primary) {
          return res.status(400).json({ success: false, message: 'Name is required' })
        }
        name = nextName || primary
        nameEn = name
        nameRu = nextRu || null
        nameAr = nextAr || null
      }

      let slug = existing.slug
      if (
        parsed.name !== undefined ||
        parsed.nameRu !== undefined ||
        parsed.nameAr !== undefined
      ) {
        const prevSlugSource = (existing.nameEn || existing.name).trim()
        const nextSlugSource = (name || nameRu || nameAr || '').trim()
        if (nextSlugSource && nextSlugSource !== prevSlugSource) {
          const base = generateSlug(nextSlugSource)
          slug = await generateUniqueSlug(base, async (s) => {
            const ex = await prisma.area.findFirst({
              where: { slug: s, NOT: { id } },
            })
            return !!ex
          })
        }
      }

      let nextParentId = existing.parentId
      if (parsed.parentId !== undefined) {
        nextParentId = parsed.parentId?.trim() || null
        const hierarchyError = await validateAreaParent(
          prisma as unknown as Parameters<typeof validateAreaParent>[0],
          nextParentId,
          id
        )
        if (hierarchyError) {
          return res.status(400).json({
            success: false,
            code: hierarchyError,
            message: HIERARCHY_ERROR_MESSAGES[hierarchyError],
          })
        }
      }

      const baseData = {
        name,
        nameEn: nameEn,
        ...(parsed.description !== undefined && {
          description: parsed.description?.trim() || null,
        }),
        ...(parsed.city !== undefined && {
          city: parsed.city?.trim() || existing.city,
        }),
        ...(parsed.image !== undefined && { image: parsed.image || null }),
        ...(parsed.sortOrder !== undefined && { sortOrder: parsed.sortOrder }),
        ...(parsed.tags !== undefined && { tags: parsed.tags }),
        ...(parsed.parentId !== undefined && { parentId: nextParentId }),
        ...(parsed.mapEmbed !== undefined && {
          mapEmbed: parsed.mapEmbed?.trim() || null,
        }),
        slug,
      }

      const localeData = {
        ...(parsed.nameRu !== undefined && { nameRu }),
        ...(parsed.nameAr !== undefined && { nameAr }),
        ...(parsed.descriptionRu !== undefined && {
          descriptionRu: parsed.descriptionRu?.trim() || null,
        }),
        ...(parsed.descriptionAr !== undefined && {
          descriptionAr: parsed.descriptionAr?.trim() || null,
        }),
        ...(parsed.tagsRu !== undefined && {
          tagsRu: parsed.tagsRu.map((v) => v.trim()).filter(Boolean),
        }),
        ...(parsed.tagsAr !== undefined && {
          tagsAr: parsed.tagsAr.map((v) => v.trim()).filter(Boolean),
        }),
      }

      let includeLocaleContent = true
      let includeIsActive = true
      const hasImagesPayload = parsed.images !== undefined

      type TxClient = {
        areaImage: { deleteMany: (args: { where: { areaId: string } }) => Promise<unknown> }
        area: {
          update: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
        }
      }
      type PrismaWithTx = {
        $transaction: <T>(fn: (tx: TxClient) => Promise<T>) => Promise<T>
      }

      const runUpdate = async () => {
        const data = {
          ...baseData,
          ...(includeLocaleContent ? localeData : {}),
          ...(includeIsActive &&
            parsed.isActive !== undefined && { isActive: parsed.isActive }),
        }
        if (hasImagesPayload) {
          return (prisma as unknown as PrismaWithTx).$transaction(async (tx) => {
            await tx.areaImage.deleteMany({ where: { areaId: id } })
            return tx.area.update({
              where: { id },
              data: {
                ...data,
                images: {
                  create: (parsed.images ?? []).map((img, idx) => ({
                    url: img.url,
                    alt: img.alt || null,
                    order: img.order ?? idx,
                    isMain: !!img.isMain,
                  })),
                },
              },
              include: { images: true },
            })
          })
        }
        return prisma.area.update({
          where: { id },
          data,
          include: { images: true },
        })
      }

      let area: Awaited<ReturnType<typeof runUpdate>> | undefined
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          area = await runUpdate()
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
        return res.status(500).json({ message: 'Failed to update area' })
      }

      return res.status(200).json({ success: true, area })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.issues })
      }
      log.errorWithException('Error updating area', error)
      return res.status(500).json({
        message: error instanceof Error ? error.message : 'Internal server error',
      })
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
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : undefined
      if (code === 'P2025') {
        return res.status(404).json({ message: 'Area not found' })
      }
      log.errorWithException('Error deleting area', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
