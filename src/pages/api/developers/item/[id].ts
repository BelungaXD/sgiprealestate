import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { createScopedLogger } from '@/lib/logger'
import { getAdminSessionFromRequest } from '@/lib/adminSession'
import { adminHasPermission } from '@/lib/adminAuth'
import { z } from 'zod'
import {
  isMissingDeveloperFounded,
  isMissingDeveloperIsActive,
  isMissingDeveloperLocaleContentColumn,
  isMissingDeveloperNameLocales,
  isStaleDeveloperLocalePrismaClient,
} from '@/lib/developerPrismaCompat'

async function findDeveloperForUpdate(id: string) {
  const fullSelect = {
    id: true,
    name: true,
    nameEn: true,
    nameRu: true,
    nameAr: true,
    slug: true,
  } as const
  const minimalSelect = { id: true, name: true, slug: true } as const

  try {
    return await prisma.developer.findUnique({ where: { id }, select: fullSelect })
  } catch (error: unknown) {
    if (!isMissingDeveloperNameLocales(error)) throw error
    const row = await prisma.developer.findUnique({ where: { id }, select: minimalSelect })
    if (!row) return null
    return { ...row, nameEn: row.name, nameRu: null, nameAr: null }
  }
}

const updateDeveloperSchema = z.object({
  name: z.string().optional().nullable(),
  nameRu: z.string().optional().nullable(),
  nameAr: z.string().optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  descriptionRu: z.string().max(20000).optional().nullable(),
  descriptionAr: z.string().max(20000).optional().nullable(),
  website: z.string().optional().nullable(),
  specialties: z.array(z.string()).optional(),
  specialtiesRu: z.array(z.string()).optional(),
  specialtiesAr: z.array(z.string()).optional(),
  notableProjects: z.array(z.string()).optional(),
  notableProjectsRu: z.array(z.string()).optional(),
  notableProjectsAr: z.array(z.string()).optional(),
  founded: z.number().int().min(1000).max(9999).optional().nullable(),
  logo: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

const log = createScopedLogger('api/developers/item/[id]')
type ErrorLike = { code?: string; message?: string; name?: string; issues?: unknown }
const asErrorLike = (error: unknown): ErrorLike =>
  typeof error === 'object' && error !== null ? (error as ErrorLike) : {}

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

  const session = getAdminSessionFromRequest(req)
  if (!session || !adminHasPermission(session.role, 'manage_developers')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method === 'PUT') {
    try {
      const existing = await findDeveloperForUpdate(id)
      if (!existing) return res.status(404).json({ message: 'Developer not found' })

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updateDeveloperSchema.parse(body)

      let name = existing.name
      let nameEn = existing.nameEn || existing.name
      let nameRu: string | null = existing.nameRu ?? null
      let nameAr: string | null = existing.nameAr ?? null

      if (
        parsed.name !== undefined ||
        parsed.nameRu !== undefined ||
        parsed.nameAr !== undefined
      ) {
        const nextName = parsed.name !== undefined ? parsed.name?.trim() || '' : name
        const nextRu =
          parsed.nameRu !== undefined ? parsed.nameRu?.trim() || '' : (nameRu ?? '').trim()
        const nextAr =
          parsed.nameAr !== undefined ? parsed.nameAr?.trim() || '' : (nameAr ?? '').trim()
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

      const baseData = {
        name,
        nameEn,
        ...(parsed.description !== undefined && (() => {
          const text = parsed.description?.trim() || null
          return { description: text, descriptionEn: text }
        })()),
        ...(parsed.specialties !== undefined && {
          specialties: parsed.specialties.map((v) => v.trim()).filter(Boolean),
        }),
        ...(parsed.notableProjects !== undefined && {
          notableProjects: parsed.notableProjects.map((v) => v.trim()).filter(Boolean),
        }),
        ...(parsed.logo !== undefined && { logo: parsed.logo || null }),
        ...(website !== undefined && { website }),
        slug,
      }

      let includeFounded = true
      let includeIsActive = true
      let includeLocaleContent = true
      let localeContentSaved = true
      let developer: Awaited<ReturnType<typeof prisma.developer.update>> | undefined

      const localeData = {
        ...(parsed.nameRu !== undefined && { nameRu }),
        ...(parsed.nameAr !== undefined && { nameAr }),
        ...(parsed.descriptionRu !== undefined && {
          descriptionRu: parsed.descriptionRu?.trim() || null,
        }),
        ...(parsed.descriptionAr !== undefined && {
          descriptionAr: parsed.descriptionAr?.trim() || null,
        }),
        ...(parsed.specialtiesRu !== undefined && {
          specialtiesRu: parsed.specialtiesRu.map((v) => v.trim()).filter(Boolean),
        }),
        ...(parsed.specialtiesAr !== undefined && {
          specialtiesAr: parsed.specialtiesAr.map((v) => v.trim()).filter(Boolean),
        }),
        ...(parsed.notableProjectsRu !== undefined && {
          notableProjectsRu: parsed.notableProjectsRu.map((v) => v.trim()).filter(Boolean),
        }),
        ...(parsed.notableProjectsAr !== undefined && {
          notableProjectsAr: parsed.notableProjectsAr.map((v) => v.trim()).filter(Boolean),
        }),
      }

      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          developer = await prisma.developer.update({
            where: { id },
            data: {
              ...baseData,
              ...(includeLocaleContent ? localeData : {}),
              ...(includeFounded &&
                parsed.founded !== undefined && { founded: parsed.founded }),
              ...(includeIsActive &&
                parsed.isActive !== undefined && { isActive: parsed.isActive }),
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
        return res.status(500).json({ message: 'Failed to update developer' })
      }

      return res.status(200).json({ success: true, developer, localeContentSaved })
    } catch (error: unknown) {
      const err = asErrorLike(error)
      if (err.name === 'ZodError') {
        return res.status(400).json({ success: false, errors: err.issues })
      }
      log.errorWithException('Error updating developer', error)
      return res.status(500).json({ message: err.message || 'Internal server error' })
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
    } catch (error: unknown) {
      const err = asErrorLike(error)
      if (err.code === 'P2025') {
        return res.status(404).json({ message: 'Developer not found' })
      }
      log.errorWithException('Error deleting developer', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
