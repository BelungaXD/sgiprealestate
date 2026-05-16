import type { NextApiRequest, NextApiResponse } from 'next'
import type { AdminRole } from '../../../../../../prisma/generated/client'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/adminAuth'
import { canEditMediaFolder } from '@/lib/mediaLibrary/permissions'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/media/folders/[id]')

const ALL_ROLES: AdminRole[] = ['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR']

function parseRoles(value: unknown): AdminRole[] | null {
  if (!Array.isArray(value)) return null
  const roles = value.filter((r): r is AdminRole => ALL_ROLES.includes(r as AdminRole))
  return roles.length > 0 ? roles : null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'manage_media' })
  if (!session) return

  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (!id) {
    return res.status(400).json({ ok: false, error: 'invalid_id' })
  }

  const folder = await prisma.mediaFolder.findUnique({ where: { id } })
  if (!folder) {
    return res.status(404).json({ ok: false, error: 'not_found' })
  }

  if (req.method === 'PATCH') {
    if (session.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }
    const data: { name?: string; viewRoles?: AdminRole[]; editRoles?: AdminRole[] } = {}
    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      data.name = req.body.name.trim()
    }
    const viewRoles = parseRoles(req.body?.viewRoles)
    const editRoles = parseRoles(req.body?.editRoles)
    if (viewRoles) data.viewRoles = viewRoles
    if (editRoles) data.editRoles = editRoles

    try {
      const updated = await prisma.mediaFolder.update({ where: { id }, data })
      return res.status(200).json({ ok: true, folder: updated })
    } catch (error) {
      log.errorWithException('update folder failed', error)
      return res.status(500).json({ ok: false, error: 'update_failed' })
    }
  }

  if (req.method === 'DELETE') {
    if (session.role !== 'SUPER_ADMIN' || folder.isSystem) {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }
    try {
      await prisma.mediaFolder.delete({ where: { id } })
      return res.status(200).json({ ok: true })
    } catch (error) {
      log.errorWithException('delete folder failed', error)
      return res.status(500).json({ ok: false, error: 'delete_failed' })
    }
  }

  if (req.method === 'GET') {
    if (!canEditMediaFolder(session.role, folder) && session.role !== 'SUPER_ADMIN') {
      const { canViewMediaFolder } = await import('@/lib/mediaLibrary/permissions')
      if (!canViewMediaFolder(session.role, folder)) {
        return res.status(403).json({ ok: false, error: 'forbidden' })
      }
    }
    return res.status(200).json({ ok: true, folder })
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
