import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { createScopedLogger } from '@/lib/logger'
import { managerLeadScope, requireAdminSession } from '@/lib/adminAuth'

const log = createScopedLogger('api/admin/inquiries')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'view_inquiries' })
  if (!session) return

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  try {
    const leadScope = managerLeadScope(session)
    const inquiries = await prisma.lead.findMany({
      where: leadScope ? { assignedAdminId: leadScope.assignedAdminId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        source: true,
        page: true,
        status: true,
        notes: true,
        assignedAdminId: true,
        createdAt: true,
      },
    })
    return res.status(200).json({ ok: true, inquiries })
  } catch (error) {
    log.errorWithException('Failed to load inquiries', error)
    return res.status(500).json({ ok: false, error: 'failed_to_load_inquiries' })
  }
}
