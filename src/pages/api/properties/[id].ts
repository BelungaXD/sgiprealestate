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

      // Validate data
      const validatedData = propertySchema.parse(body)

      // Generate unique slug if changed
      let slug = validatedData.slug || generateSlug(validatedData.title)
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
      // Verify developerId exists in database if provided
      if (developerId) {
        try {
          let developerExists = await prisma.developer.findUnique({ where: { id: developerId } })
          if (!developerExists) {
            developerExists = await prisma.developer.findUnique({ where: { slug: developerId } })
            if (developerExists) developerId = developerExists.id
          }
          if (!developerExists) {
            console.warn(`Developer with ID/slug ${developerId} not found, setting developerId to null`)
            developerId = null
          }
        } catch (dbError: any) {
          console.error('Database query failed for developer check:', dbError.message)
          developerId = null
        }
      }

      // Update property
      const property = await prisma.property.update({
        where: { id },
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
          completionDate: validatedData.completionDate,
          address: validatedData.address,
          city: validatedData.city,
          district: validatedData.district,
          areaId: areaId,
          developerId: developerId,
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
      })

      if (!property) {
        return res.status(404).json({ message: 'Property not found' })
      }

      // Delete property (images and floor plans will be deleted via cascade)
      await prisma.property.delete({
        where: { id },
      })

      return res.status(200).json({
        success: true,
        message: 'Property deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting property:', error)
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

