import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { propertySchema } from '@/lib/validations/property'
import { resolveNewPropertySlug, generateUniqueSlug } from '@/lib/utils/slug'
import { normalizeUploadUrl } from '@/lib/utils/imageUrl'
import { createScopedLogger } from '@/lib/logger'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '800mb',
    },
  },
}
const log = createScopedLogger('api/properties')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  log.info('Request received', {
    method: req.method,
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    listingMarket: req.query.listingMarket,
  })
  // GET - List properties
  if (req.method === 'GET') {
    // If database is not configured, return empty array
    if (!process.env.DATABASE_URL) {
      return res.status(200).json({
        properties: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      })
    }

    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const status = req.query.status as string | undefined
      const listingMarket = req.query.listingMarket as string | undefined
      const areaId = req.query.areaId as string | undefined
      const developerId = req.query.developerId as string | undefined
      const sort = (req.query.sort as string) || 'createdAt-desc'
      const skip = (page - 1) * limit

      const where: Record<string, unknown> = {}
      if (status) where.status = status
      if (listingMarket === 'PRIMARY' || listingMarket === 'SECONDARY') {
        where.listingMarket = listingMarket
      }
      if (areaId) where.areaId = areaId
      if (developerId) where.developerId = developerId

      let orderBy: Record<string, 'asc' | 'desc'> | Record<string, 'asc' | 'desc'>[] = {
        createdAt: 'desc',
      }
      switch (sort) {
        case 'price-asc':
          orderBy = { price: 'asc' }
          break
        case 'price-desc':
          orderBy = { price: 'desc' }
          break
        case 'area-asc':
          orderBy = { areaSqm: 'asc' }
          break
        case 'area-desc':
          orderBy = { areaSqm: 'desc' }
          break
        case 'createdAt-asc':
          orderBy = { createdAt: 'asc' }
          break
        case 'createdAt-desc':
        default:
          orderBy = { createdAt: 'desc' }
      }

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          include: {
            area: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
              },
            },
            developer: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                slug: true,
                logo: true,
              },
            },
            images: {
              orderBy: { order: 'asc' },
              take: 1,
            },
            files: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.property.count({ where }),
      ])

      // Normalize image/file URLs for standalone mode (/api/uploads/...)
      const normalizedProperties = properties.map((p: any) => ({
        ...p,
        images: (p.images || []).map((img: any) => ({
          ...img,
          url: normalizeUploadUrl(img.url),
        })),
        files: (p.files || []).map((f: any) => ({
          ...f,
          url: normalizeUploadUrl(f.url),
        })),
      }))

      return res.status(200).json({
        properties: normalizedProperties,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    } catch (error: any) {
      log.errorWithException('Error fetching properties', error)
      
      // If database connection error or Prisma not initialized, return empty array
      if (
        error.code === 'P1001' || 
        error.message?.includes('DATABASE_URL') || 
        error.message?.includes('Can\'t reach database') || 
        error.message?.includes('Environment variable not found') ||
        error.message?.includes('Database is not configured') ||
        error.message?.includes('did not initialize')
      ) {
        return res.status(200).json({
          properties: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        })
      }
      
      return res.status(500).json({
        properties: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        message: 'Internal server error',
      })
    }
  }

  // POST - Create property
  if (req.method === 'POST') {
    try {
      // Check if DATABASE_URL is configured
      if (!process.env.DATABASE_URL) {
        // In demo mode, return success but don't actually save
        return res.status(200).json({
          success: true,
          message: 'Property saved (demo mode - database not configured)',
          property: {
            id: `demo-${Date.now()}`,
            ...req.body,
            createdAt: new Date().toISOString(),
          },
        })
      }

      // Check database connection first
      try {
        await prisma.$connect()
      } catch (dbError: any) {
        log.errorWithException('Database connection error', dbError)
        // If database is configured but not available, return error instead of demo mode
        return res.status(500).json({
          success: false,
          message: 'Database connection error. Please check your database configuration and ensure the database server is running.',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        })
      }

      // Parse JSON body
      let body
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      } catch (parseError: any) {
        log.errorWithException('Error parsing request body', parseError)
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body',
        })
      }

      const parsed = propertySchema.safeParse(body)
      if (!parsed.success) {
        const message = parsed.error.issues
          .map((e) => `${e.path.length ? e.path.join('.') : 'field'}: ${e.message}`)
          .join('; ')
        log.warn('Property POST validation failed', { message })
        return res.status(400).json({
          success: false,
          message: message || 'Validation error',
          errors: parsed.error.issues,
        })
      }
      const validatedData = parsed.data

      // Generate unique slug if not provided
      let slug = resolveNewPropertySlug(validatedData.slug, validatedData.title)
      let slugExists = null
      try {
        slugExists = await prisma.property.findUnique({ where: { slug } })
      } catch (dbError: any) {
        // If database query fails, use demo mode
        log.warn('Database query failed; using demo mode for slug check', { message: dbError.message })
        slugExists = null // Continue with demo mode
      }
      if (slugExists) {
        try {
          slug = await generateUniqueSlug(
            slug,
            async (s) => {
              try {
                const exists = await prisma.property.findUnique({ where: { slug: s } })
                return !!exists
              } catch {
                // If database query fails, assume slug is available (demo mode)
                return false
              }
            }
          )
        } catch (error) {
          // If slug generation fails, just use the original slug with timestamp
          log.errorWithException('Slug generation failed, using timestamp fallback', error)
          slug = `${slug}-${Date.now()}`
        }
      }

      // Verify areaId exists (if using mock data, skip this check)
      if (validatedData.areaId) {
        try {
          const areaExists = await prisma.area.findUnique({ where: { id: validatedData.areaId } })
          if (!areaExists) {
            // If area doesn't exist, it might be a mock ID - allow it in demo mode
            log.warn('Area ID not found; allowing in demo mode', { areaId: validatedData.areaId })
          }
        } catch (dbError: any) {
          // If database query failed, allow creation with mock areaId (demo mode)
          log.warn('Database query failed for area check; allowing in demo mode', {
            message: dbError.message,
            areaId: validatedData.areaId,
          })
        }
      }

      // Resolve developerId: form may send slug (e.g. emaar-properties), DB needs real id
      let developerId = validatedData.developerId || null
      if (developerId && (developerId === '' || developerId === 'null')) developerId = null
      if (developerId) {
        try {
          let dev = await prisma.developer.findUnique({
            where: { id: developerId },
            select: { id: true },
          })
          if (!dev) {
            dev = await prisma.developer.findUnique({
              where: { slug: developerId },
              select: { id: true },
            })
            if (dev) developerId = dev.id
            else developerId = null
          }
        } catch {
          developerId = null
        }
      }

      const listingMarket = validatedData.listingMarket || 'PRIMARY'
      if (listingMarket === 'SECONDARY') {
        developerId = null
      }

      // Create property
      let property
      try {
        property = await prisma.property.create({
          data: {
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
              ? new Date(validatedData.completionDate)
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
            areaId: validatedData.areaId || null,
            developerId,
            coordinates: validatedData.coordinates || null,
            googleMapsUrl: validatedData.googleMapsUrl,
            features: validatedData.features || [],
            amenities: validatedData.amenities || [],
            slug,
            metaTitle: validatedData.metaTitle || null,
            metaDescription: validatedData.metaDescription || null,
            isPublished: validatedData.isPublished,
            isFeatured: validatedData.isFeatured,
          },
          include: {
            area: true,
            developer: true,
            images: true,
            files: true,
          },
        })
      } catch (dbError: any) {
        // Handle Prisma errors
        if (dbError.code === 'P2002') {
          return res.status(400).json({
            success: false,
            message: 'A property with this slug already exists.',
          })
        }
        if (dbError.code === 'P2003') {
          // Invalid foreign key - might be mock data, allow in demo mode
          log.warn('Invalid foreign key; using demo mode', { message: dbError.message })
          return res.status(200).json({
            success: true,
            message: 'Property saved (demo mode - using mock data)',
            property: {
              id: `demo-${Date.now()}`,
              ...validatedData,
              slug,
              createdAt: new Date().toISOString(),
            },
          })
        }
        // If database connection error, return error if DATABASE_URL is configured
        if (
          dbError.code === 'P1001' || 
          dbError.message?.includes('did not initialize')
        ) {
          if (process.env.DATABASE_URL) {
            log.errorWithException('Database connection error while creating property', dbError)
            return res.status(500).json({
              success: false,
              message: 'Database connection error. Please check your database configuration and ensure the database server is running.',
              error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
            })
          }
          // Only use demo mode if DATABASE_URL is not configured
          log.warn('Database not configured; using demo mode', { message: dbError.message })
          return res.status(200).json({
            success: true,
            message: 'Property saved (demo mode - database not configured)',
            property: {
              id: `demo-${Date.now()}`,
              ...validatedData,
              slug,
              createdAt: new Date().toISOString(),
            },
          })
        }
        
        // Handle Database is not configured error
        if (
          dbError.message?.includes('DATABASE_URL') || 
          dbError.message?.includes('Database is not configured')
        ) {
          if (!process.env.DATABASE_URL) {
            log.warn('Database not configured; using demo mode', { message: dbError.message })
            return res.status(200).json({
              success: true,
              message: 'Property saved (demo mode - database not configured)',
              property: {
                id: `demo-${Date.now()}`,
                ...validatedData,
                slug,
                createdAt: new Date().toISOString(),
              },
            })
          }
          // If DATABASE_URL is configured but error occurs, return error
          log.errorWithException('Database error while creating property', dbError)
          return res.status(500).json({
            success: false,
            message: 'Database error. Please check your database configuration.',
            error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
          })
        }
        throw dbError
      }

      // Handle images if provided
      if (body.images && Array.isArray(body.images) && body.images.length > 0) {
        try {
          const imageData = body.images.map((img: any, index: number) => ({
            propertyId: property.id,
            url: typeof img === 'string' ? img : img.url || img,
            alt: typeof img === 'object' ? img.alt : null,
            order: index,
            isMain: index === 0,
          }))

          await prisma.propertyImage.createMany({
            data: imageData,
          })
        } catch (imageError: any) {
          log.errorWithException('Error creating images', imageError)
          // Continue even if images fail - property is already created
        }
      }

      // Handle files if provided
      if (body.files && Array.isArray(body.files) && body.files.length > 0) {
        try {
          const fileData = body.files
            .filter((file: any) => file.label && (file.url || file.file))
            .map((file: any, index: number) => {
              // If file is a File object, we need to upload it first
              // For now, we'll expect files to be uploaded and have URLs
              const fileUrl = file.url || (file.file ? null : null)
              
              // If file.file exists, it means it's a new file that needs to be uploaded
              // We'll handle this by converting to base64 and saving
              if (file.file && !fileUrl) {
                // This will be handled by the frontend uploading files first
                return null
              }

              return {
                propertyId: property.id,
                url: fileUrl || file.url,
                label: file.label,
                filename: file.filename || file.url?.split('/').pop() || 'file',
                size: file.size || null,
                mimeType: file.mimeType || null,
                order: index,
              }
            })
            .filter((item: any) => item !== null)

          if (fileData.length > 0) {
            await prisma.propertyFile.createMany({
              data: fileData,
            })
          }
        } catch (fileError: any) {
          log.errorWithException('Error creating files', fileError)
          // Continue even if files fail - property is already created
        }
      }

      // Reload property with images
      let propertyWithImages
      try {
        propertyWithImages = await prisma.property.findUnique({
          where: { id: property.id },
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
      } catch (reloadError: any) {
        log.errorWithException('Error reloading property', reloadError)
        // Return property without reload if query fails
        propertyWithImages = property
      }

      return res.status(201).json({
        success: true,
        property: propertyWithImages || property,
      })
    } catch (error: any) {
      log.errorWithException('Error creating property', error, {
        details: {
          name: error.name,
          code: error.code,
          message: error.message,
          stack: error.stack,
        },
      })
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        })
      }

      // Handle Prisma connection errors
      if (
        error.code === 'P1001' || 
        error.message?.includes('Can\'t reach database') ||
        error.message?.includes('did not initialize')
      ) {
        // If DATABASE_URL is configured but connection fails, return error
        if (process.env.DATABASE_URL) {
          log.errorWithException('Database connection error', error)
          return res.status(500).json({
            success: false,
            message: 'Database connection error. Please check your database configuration and ensure the database server is running.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
          })
        }
        // Only use demo mode if DATABASE_URL is not configured
        log.warn('Database not configured; using demo mode', { message: error.message })
        let bodyData = {}
        try {
          bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        } catch {
          // Ignore parse errors
        }
        
        return res.status(200).json({
          success: true,
          message: 'Property saved (demo mode - database not configured)',
          property: {
            id: `demo-${Date.now()}`,
            ...bodyData,
            createdAt: new Date().toISOString(),
          },
        })
      }
      
      // Handle DATABASE_URL not configured error
      if (
        error.message?.includes('DATABASE_URL') || 
        error.message?.includes('Environment variable not found') ||
        error.message?.includes('Database is not configured')
      ) {
        // Only use demo mode if DATABASE_URL is truly not configured
        if (!process.env.DATABASE_URL) {
          log.warn('Database not configured; using demo mode', { message: error.message })
          let bodyData = {}
          try {
            bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
          } catch {
            // Ignore parse errors
          }
          
          return res.status(200).json({
            success: true,
            message: 'Property saved (demo mode - database not configured)',
            property: {
              id: `demo-${Date.now()}`,
              ...bodyData,
              createdAt: new Date().toISOString(),
            },
          })
        }
        // If DATABASE_URL is configured but error occurs, return error
        log.errorWithException('Database error', error)
        return res.status(500).json({
          success: false,
          message: 'Database error. Please check your database configuration.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        })
      }

      // Handle other Prisma errors - return error instead of demo mode
      if (error.code?.startsWith('P')) {
        log.errorWithException('Prisma error while saving property', error, { code: error.code })
        return res.status(500).json({
          success: false,
          message: 'Database error occurred while saving property.',
          error: process.env.NODE_ENV === 'development' ? `${error.code}: ${error.message}` : undefined,
        })
      }

      // For other errors, return error instead of demo mode
      log.errorWithException('Unexpected error while saving property', error)
      return res.status(500).json({
        success: false,
        message: 'An error occurred while saving property.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

