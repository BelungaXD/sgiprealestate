import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { propertySchema } from '@/lib/validations/property'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'
import { normalizeUploadUrl } from '@/lib/utils/imageUrl'

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
      const skip = (page - 1) * limit

      const where = status ? { status: status as any } : {}

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
          orderBy: { createdAt: 'desc' },
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
      console.error('Error fetching properties:', error)
      
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
      
      return res.status(500).json({ message: 'Internal server error' })
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
        console.error('Database connection error:', dbError.message)
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
        console.error('Error parsing request body:', parseError)
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body',
        })
      }

      // Validate data
      let validatedData
      try {
        validatedData = propertySchema.parse({
          ...body,
          // Handle images array - can be file URLs or base64
          // For now, we'll expect image URLs as strings
        })
      } catch (validationError: any) {
        console.error('Validation error:', validationError)
        if (validationError.name === 'ZodError') {
          return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: validationError.errors,
          })
        }
        throw validationError
      }

      // Generate unique slug if not provided
      let slug = validatedData.slug || generateSlug(validatedData.title)
      let slugExists = null
      try {
        slugExists = await prisma.property.findUnique({ where: { slug } })
      } catch (dbError: any) {
        // If database query fails, use demo mode
        console.warn('Database query failed, using demo mode for slug check:', dbError.message)
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
          console.warn('Slug generation failed, using timestamp:', error)
          slug = `${slug}-${Date.now()}`
        }
      }

      // Verify areaId exists (if using mock data, skip this check)
      if (validatedData.areaId) {
        try {
          const areaExists = await prisma.area.findUnique({ where: { id: validatedData.areaId } })
          if (!areaExists) {
            // If area doesn't exist, it might be a mock ID - allow it in demo mode
            console.warn(`Area with ID ${validatedData.areaId} not found, allowing in demo mode`)
          }
        } catch (dbError: any) {
          // If database query fails, allow creation with mock areaId (demo mode)
          console.warn('Database query failed for area check, allowing in demo mode:', dbError.message)
        }
      }

      // Create property
      let property
      try {
        property = await prisma.property.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            type: (validatedData.type || 'APARTMENT') as any,
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
              ? (validatedData.completionDate instanceof Date 
                  ? validatedData.completionDate 
                  : new Date(validatedData.completionDate))
              : null,
            address: validatedData.address,
            city: validatedData.city,
            district: validatedData.district,
            areaId: validatedData.areaId || null,
            developerId: validatedData.developerId || null,
            coordinates: validatedData.coordinates || null,
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
          console.warn('Invalid foreign key, using demo mode:', dbError.message)
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
            console.error('Database connection error:', dbError.message)
            return res.status(500).json({
              success: false,
              message: 'Database connection error. Please check your database configuration and ensure the database server is running.',
              error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
            })
          }
          // Only use demo mode if DATABASE_URL is not configured
          console.warn('Database not configured, using demo mode:', dbError.message)
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
            console.warn('Database not configured, using demo mode:', dbError.message)
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
          console.error('Database error:', dbError.message)
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
          console.error('Error creating images:', imageError)
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
          console.error('Error creating files:', fileError)
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
        console.error('Error reloading property:', reloadError)
        // Return property without reload if query fails
        propertyWithImages = property
      }

      return res.status(201).json({
        success: true,
        property: propertyWithImages || property,
      })
    } catch (error: any) {
      console.error('Error creating property:', error)
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack,
      })
      
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
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
          console.error('Database connection error:', error.message)
          return res.status(500).json({
            success: false,
            message: 'Database connection error. Please check your database configuration and ensure the database server is running.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
          })
        }
        // Only use demo mode if DATABASE_URL is not configured
        console.warn('Database not configured, using demo mode:', error.message)
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
          console.warn('Database not configured, using demo mode:', error.message)
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
        console.error('Database error:', error.message)
        return res.status(500).json({
          success: false,
          message: 'Database error. Please check your database configuration.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        })
      }

      // Handle other Prisma errors - return error instead of demo mode
      if (error.code?.startsWith('P')) {
        console.error('Prisma error:', error.code, error.message)
        return res.status(500).json({
          success: false,
          message: 'Database error occurred while saving property.',
          error: process.env.NODE_ENV === 'development' ? `${error.code}: ${error.message}` : undefined,
        })
      }

      // For other errors, return error instead of demo mode
      console.error('Unexpected error:', error.message)
      return res.status(500).json({
        success: false,
        message: 'An error occurred while saving property.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

