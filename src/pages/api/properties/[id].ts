import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { propertySchema } from '@/lib/validations/property'
import { resolveUpdatePropertySlug, generateUniqueSlug } from '@/lib/utils/slug'
import { normalizeUploadUrl } from '@/lib/utils/imageUrl'
import { deletePropertyMediaFiles } from '@/lib/utils/deletePropertyMediaFiles'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '800mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid property ID' })
  }

  // GET - Get single property
  if (req.method === 'GET') {
    try {
      // Try to find by ID first, then by slug
      let property = await prisma.property.findUnique({
        where: { id },
        include: {
          area: true,
          developer: true,
          images: {
            orderBy: { order: 'asc' },
          },
          floorPlans: {
            orderBy: { order: 'asc' },
          },
          files: {
            orderBy: { order: 'asc' },
          },
        },
      })

      // If not found by ID, try to find by slug
      if (!property) {
        property = await prisma.property.findUnique({
          where: { slug: id },
          include: {
            area: true,
            developer: true,
            images: {
              orderBy: { order: 'asc' },
            },
            floorPlans: {
              orderBy: { order: 'asc' },
            },
            files: {
              orderBy: { order: 'asc' },
            },
          },
        })
      }

      if (!property) {
        return res.status(404).json({ message: 'Property not found' })
      }

      // Normalize image/file URLs for standalone mode (/api/uploads/...)
      const normalizedProperty = {
        ...property,
        images: (property.images || []).map((img: any) => ({
          ...img,
          url: normalizeUploadUrl(img.url),
        })),
        files: (property.files || []).map((f: any) => ({
          ...f,
          url: normalizeUploadUrl(f.url),
        })),
      }

      return res.status(200).json({ property: normalizedProperty })
    } catch (error) {
      console.error('Error fetching property:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // PUT - Update property
  if (req.method === 'PUT') {
    try {
      // Check if DATABASE_URL is configured
      if (!process.env.DATABASE_URL) {
        // In demo mode, return success but don't actually save
        return res.status(200).json({
          success: true,
          message: 'Property updated (demo mode - database not configured)',
          property: {
            id,
            ...req.body,
            updatedAt: new Date().toISOString(),
          },
        })
      }

      // Check if property exists
      const existingProperty = await prisma.property.findUnique({
        where: { id },
      })

      if (!existingProperty) {
        return res.status(404).json({ message: 'Property not found' })
      }

      // Parse JSON body
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

      const clRaw = req.headers['content-length']
      const cl =
        typeof clRaw === 'string'
          ? parseInt(clRaw, 10)
          : Array.isArray(clRaw)
            ? parseInt(clRaw[0], 10)
            : NaN
      const bodyBytes =
        Number.isFinite(cl) && cl > 0
          ? cl
          : typeof req.body === 'string'
            ? Buffer.byteLength(req.body, 'utf8')
            : (() => {
                try {
                  return Buffer.byteLength(JSON.stringify(req.body), 'utf8')
                } catch {
                  return 0
                }
              })()
      if (bodyBytes > 400_000) {
        console.warn(
          `[${new Date().toISOString()}] PUT property ${id} body ~${bodyBytes} bytes (images/files omitted in log)`
        )
      }

      const parsed = propertySchema.safeParse(body)
      if (!parsed.success) {
        const message = parsed.error.errors
          .map((e) => `${e.path.length ? e.path.join('.') : 'field'}: ${e.message}`)
          .join('; ')
        console.warn(
          `[${new Date().toISOString()}] Property PUT validation failed for ${id}:`,
          message
        )
        return res.status(400).json({
          success: false,
          message: message || 'Validation error',
          errors: parsed.error.errors,
        })
      }
      const validatedData = parsed.data

      // Generate unique slug if changed (never empty)
      let slug = resolveUpdatePropertySlug(
        validatedData.slug,
        validatedData.title,
        existingProperty.slug
      )
      if (slug !== existingProperty.slug) {
        const slugExists = await prisma.property.findUnique({ where: { slug } })
        if (slugExists && slugExists.id !== id) {
          slug = await generateUniqueSlug(
            slug,
            async (s) => {
              const exists = await prisma.property.findUnique({ where: { slug: s } })
              return !!exists && exists.id !== id
            }
          )
        }
      }

      // Validate and sanitize areaId - ensure it exists if provided
      let areaId = validatedData.areaId || null
      // Handle empty strings
      if (areaId === '' || areaId === 'null' || areaId === 'undefined') {
        areaId = null
      }
      // Verify areaId exists in database if provided
      if (areaId) {
        try {
          const areaExists = await prisma.area.findUnique({ where: { id: areaId } })
          if (!areaExists) {
            console.warn(`Area with ID ${areaId} not found, setting areaId to null`)
            areaId = null
          }
        } catch (dbError: any) {
          console.error('Database query failed for area check:', dbError.message)
          // If database query fails, set to null to avoid foreign key constraint violation
          areaId = null
        }
      }

      // Validate and sanitize developerId - ensure it exists if provided
      let developerId = validatedData.developerId || null
      // Handle empty strings
      if (developerId === '' || developerId === 'null' || developerId === 'undefined') {
        developerId = null
      }
      if (developerId) {
        const developerLookup = developerId
        try {
          const developerRecord = await prisma.developer.findFirst({
            where: { OR: [{ id: developerLookup }, { slug: developerLookup }] },
            select: { id: true },
          })
          developerId = developerRecord?.id ?? null
          if (!developerRecord) {
            console.warn(
              `Developer with ID/slug ${developerLookup} not found, setting developerId to null`
            )
          }
        } catch (dbError: any) {
          console.error('Database query failed for developer check:', dbError.message)
          developerId = null
        }
      }

      const listingMarket = validatedData.listingMarket || 'PRIMARY'
      if (listingMarket === 'SECONDARY') {
        developerId = null
      }

      const updateData: Record<string, unknown> = {
        title: validatedData.title,
        description: validatedData.description ?? null,
        type: (validatedData.type || 'APARTMENT') as any,
        listingMarket: listingMarket as any,
        price: validatedData.price,
        currency: validatedData.currency,
        status: validatedData.status as any,
        areaSqm: validatedData.areaSqm,
        bedrooms: validatedData.bedrooms,
        bathrooms: validatedData.bathrooms,
        parking: validatedData.parking,
        floor: validatedData.floor,
        totalFloors: validatedData.totalFloors,
        yearBuilt: validatedData.yearBuilt,
        completionDate: validatedData.completionDate
          ? validatedData.completionDate instanceof Date
            ? validatedData.completionDate
            : new Date(validatedData.completionDate as unknown as string)
          : null,
        paymentPlan:
          listingMarket === 'PRIMARY'
            ? validatedData.paymentPlan?.trim() || null
            : null,
        occupancyStatus:
          listingMarket === 'SECONDARY'
            ? (validatedData.occupancyStatus as any) || null
            : null,
        address: validatedData.address,
        city: validatedData.city,
        district: validatedData.district,
        areaId: areaId,
        developerId: developerId,
        googleMapsUrl: validatedData.googleMapsUrl,
        features: validatedData.features || [],
        amenities: validatedData.amenities || [],
        slug,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        isPublished: validatedData.isPublished,
        isFeatured: validatedData.isFeatured,
      }

      if (Object.prototype.hasOwnProperty.call(body, 'coordinates')) {
        updateData.coordinates = validatedData.coordinates ?? null
      }

      // Update property
      const property = await prisma.property.update({
        where: { id },
        data: updateData as any,
        include: {
          area: true,
          developer: true,
          images: {
            orderBy: { order: 'asc' },
          },
        },
      })

      // Handle images update if provided (only update if images array is explicitly provided)
      if (body.images !== undefined && Array.isArray(body.images)) {
        // Delete existing images only if new images are being set
        await prisma.propertyImage.deleteMany({
          where: { propertyId: id },
        })

        // Create new images
        if (body.images.length > 0) {
          const imageData = body.images
            .filter((img: any) => img && (typeof img === 'string' ? img.trim() !== '' : img.url))
            .map((img: any, index: number) => ({
              propertyId: id,
              url: typeof img === 'string' ? img.trim() : (img.url || '').trim(),
              alt: typeof img === 'object' ? img.alt : null,
              order: index,
              isMain: index === 0,
            }))
            .filter((img: any) => img.url !== '')

          if (imageData.length > 0) {
            await prisma.propertyImage.createMany({
              data: imageData,
            })
          }
        }
      }

      // Handle files update if provided
      if (body.files && Array.isArray(body.files)) {
        // Delete existing files
        await prisma.propertyFile.deleteMany({
          where: { propertyId: id },
        })

        // Create new files
        if (body.files.length > 0) {
          const fileData = body.files
            .filter((file: any) => file.label && (file.url || file.file))
            .map((file: any, index: number) => ({
              propertyId: id,
              url: file.url || '',
              label: file.label,
              filename: file.filename || file.url?.split('/').pop() || 'file',
              size: file.size || null,
              mimeType: file.mimeType || null,
              order: index,
            }))

          if (fileData.length > 0) {
            await prisma.propertyFile.createMany({
              data: fileData,
            })
          }
        }
      }

      // Reload property with images and files
      const propertyWithImages = await prisma.property.findUnique({
        where: { id },
        include: {
          area: true,
          developer: true,
          images: {
            orderBy: { order: 'asc' },
          },
          files: {
            orderBy: { order: 'asc' },
          },
        },
      })

      // Normalize image/file URLs for standalone mode
      const normalizedProperty = propertyWithImages ? {
        ...propertyWithImages,
        images: (propertyWithImages.images || []).map((img: any) => ({
          ...img,
          url: normalizeUploadUrl(img.url),
        })),
        files: (propertyWithImages.files || []).map((f: any) => ({
          ...f,
          url: normalizeUploadUrl(f.url),
        })),
      } : null

      return res.status(200).json({
        success: true,
        property: normalizedProperty || propertyWithImages,
      })
    } catch (error: any) {
      console.error('Error updating property:', error)
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        })
      }

      // Handle Prisma foreign key constraint violations
      if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
        const constraintMatch = error.message?.match(/`(\w+)`/i)
        const constraintName = constraintMatch ? constraintMatch[1] : 'foreign key'
        return res.status(400).json({
          success: false,
          message: `Invalid reference: The ${constraintName.replace('_fkey', '').replace('properties_', '').replace('Id', '')} does not exist in the database.`,
        })
      }

      // Handle Prisma connection errors
      if (error.code === 'P1001' || error.message?.includes('DATABASE_URL') || error.message?.includes('Can\'t reach database')) {
        return res.status(503).json({
          success: false,
          message: 'Database connection error. Please configure DATABASE_URL in your .env file.',
        })
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      })
    }
  }

  // DELETE - Delete property
  if (req.method === 'DELETE') {
    try {
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          images: { select: { url: true } },
          files: { select: { url: true } },
          floorPlans: { select: { url: true } },
        },
      })

      if (!property) {
        return res.status(404).json({ message: 'Property not found' })
      }

      const mediaUrls = [
        ...property.images.map((i: { url: string }) => i.url),
        ...property.files.map((f: { url: string }) => f.url),
        ...property.floorPlans.map((fp: { url: string }) => fp.url),
      ]

      await prisma.property.delete({
        where: { id },
      })

      void deletePropertyMediaFiles(mediaUrls).catch((err) => {
        console.error(`[${new Date().toISOString()}] Property ${id} media cleanup failed:`, err)
      })

      return res.status(200).json({
        success: true,
        message: 'Property deleted successfully',
      })
    } catch (error: unknown) {
      console.error('Error deleting property:', error)
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : ''
      if (code === 'P2003') {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete property: linked records block deletion. Run DB migration (Lead onDelete: SetNull) or remove links.',
        })
      }
      const message =
        error instanceof Error ? error.message : 'Internal server error'
      return res.status(500).json({
        success: false,
        message: message || 'Internal server error',
      })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

