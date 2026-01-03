import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Slug is required' })
  }

  // If database is not configured, return 404
  if (!process.env.DATABASE_URL) {
    return res.status(404).json({ message: 'Developer not found' })
  }

  // GET - Fetch developer
  if (req.method === 'GET') {
    try {
      const developer = await prisma.developer.findUnique({
        where: { slug },
        include: {
          _count: {
            select: {
              properties: true,
            },
          },
        },
      })

      if (!developer) {
        return res.status(404).json({ message: 'Developer not found' })
      }

      return res.status(200).json({ developer })
    } catch (error: any) {
      console.error('Error fetching developer:', error)
      
      // If database connection error, return 404
      if (error.code === 'P1001' || error.message?.includes('DATABASE_URL') || error.message?.includes('Can\'t reach database') || error.message?.includes('Environment variable not found')) {
        return res.status(404).json({ message: 'Developer not found' })
      }
      
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // PATCH - Update developer (for logo and other fields)
  if (req.method === 'PATCH') {
    try {
      const body = req.body
      
      const updateData: any = {}
      
      if (body.logo !== undefined) {
        updateData.logo = body.logo
      }
      if (body.name !== undefined) {
        updateData.name = body.name
      }
      if (body.nameEn !== undefined) {
        updateData.nameEn = body.nameEn
      }
      if (body.description !== undefined) {
        updateData.description = body.description
      }
      if (body.descriptionEn !== undefined) {
        updateData.descriptionEn = body.descriptionEn
      }
      if (body.website !== undefined) {
        updateData.website = body.website
      }
      if (body.email !== undefined) {
        updateData.email = body.email
      }
      if (body.phone !== undefined) {
        updateData.phone = body.phone
      }
      if (body.address !== undefined) {
        updateData.address = body.address
      }
      if (body.city !== undefined) {
        updateData.city = body.city
      }

      const developer = await prisma.developer.update({
        where: { slug },
        data: updateData,
      })

      return res.status(200).json({ developer })
    } catch (error: any) {
      console.error('Error updating developer:', error)
      
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Developer not found' })
      }
      
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

