import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // If database is not configured, return empty array
  if (!process.env.DATABASE_URL) {
    return res.status(200).json({ developers: [] })
  }

  try {
    const developers = await prisma.developer.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        logo: true,
        description: true,
        descriptionEn: true,
        city: true,
        website: true,
        _count: {
          select: {
            properties: {
              where: {
                isPublished: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transform to include properties count and normalize logo paths
    const developersWithCount = developers.map((dev: typeof developers[0]) => ({
      ...dev,
      logo: normalizeImageUrl(dev.logo),
      propertiesCount: dev._count.properties,
    }))

    return res.status(200).json({ developers: developersWithCount })
  } catch (error: any) {
    console.error('Error fetching developers:', error)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    })
    
    // If database connection error, return empty array instead of error
    if (error.code === 'P1001' || error.message?.includes('DATABASE_URL') || error.message?.includes('Can\'t reach database') || error.message?.includes('Environment variable not found')) {
      return res.status(200).json({ developers: [] })
    }
    
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

