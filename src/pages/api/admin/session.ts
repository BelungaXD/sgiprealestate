import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminSessionFromRequest } from '@/lib/adminSession'
import { getVisibleAdminTabs } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false })
  }

  const session = getAdminSessionFromRequest(req)
  if (!session) {
    return res.status(200).json({ ok: false })
  }

  let name: string | null = null
  if (session.adminId) {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: session.adminId },
        select: { name: true, email: true, role: true, isActive: true },
      })
      if (!admin || !admin.isActive) {
        return res.status(200).json({ ok: false })
      }
      name = admin.name
    } catch {
      return res.status(200).json({ ok: false })
    }
  }

  return res.status(200).json({
    ok: true,
    user: {
      id: session.adminId,
      email: session.email,
      name,
      role: session.role,
      isEnvBootstrap: session.isEnvBootstrap,
    },
    tabs: getVisibleAdminTabs(session.role),
  })
}
