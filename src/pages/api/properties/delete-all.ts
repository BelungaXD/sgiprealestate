import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { deletePropertyMediaFiles } from '@/lib/utils/deletePropertyMediaFiles'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/properties/delete-all')

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

    const listed = await prisma.property.findMany({
      include: {
        images: { select: { url: true } },
        files: { select: { url: true } },
        floorPlans: { select: { url: true } },
      },
    })

    const deletedCount = await prisma.property.deleteMany({})

    const allMediaUrls: string[] = []
    for (const p of listed) {
      allMediaUrls.push(
        ...p.images.map((i: { url: string }) => i.url),
        ...p.files.map((f: { url: string }) => f.url),
        ...p.floorPlans.map((fp: { url: string }) => fp.url)
      )
    }
    void deletePropertyMediaFiles(allMediaUrls).catch((err) => {
      log.errorWithException('delete-all media cleanup failed', err)
    })

    return res.status(200).json({
      success: true,
      message: `Deleted ${deletedCount.count} properties`,
      count: deletedCount.count,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    log.errorWithException('Error deleting properties', error)
    return res.status(500).json({
      success: false,
      message,
    })
  }
}

