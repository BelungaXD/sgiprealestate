import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { propertySchema } from '@/lib/validations/property'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'

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
      const property = await prisma.property.findUnique({
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

      if (!property) {
        return res.status(404).json({ message: 'Property not found' })
      }

      return res.status(200).json({ property })
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
          areaId: validatedData.areaId,
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
          images: {
            orderBy: { order: 'asc' },
          },
        },
      })

      // Handle images update if provided
      if (body.images && Array.isArray(body.images)) {
        // Delete existing images
        await prisma.propertyImage.deleteMany({
          where: { propertyId: id },
        })

        // Create new images
        if (body.images.length > 0) {
          const imageData = body.images.map((img: any, index: number) => ({
            propertyId: id,
            url: typeof img === 'string' ? img : img.url || img,
            alt: typeof img === 'object' ? img.alt : null,
            order: index,
            isMain: index === 0,
          }))

          await prisma.propertyImage.createMany({
            data: imageData,
          })
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

      return res.status(200).json({
        success: true,
        property: propertyWithImages,
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

