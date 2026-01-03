import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return res.status(400).json({
        success: false,
        message: 'Database not configured',
      })
    }

    // Delete all properties (images and files will be deleted via cascade)
    const deletedCount = await prisma.property.deleteMany({})

    return res.status(200).json({
      success: true,
      message: `Deleted ${deletedCount.count} properties`,
      count: deletedCount.count,
    })
  } catch (error: any) {
    console.error('Error deleting properties:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}

