import type { NextApiRequest, NextApiResponse } from 'next'
import type { AdminRole } from '../../../../../../prisma/generated/client'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/adminAuth'
import { ensureSystemMediaFolders } from '@/lib/mediaLibrary/seed'
import { canViewMediaFolder, canEditMediaFolder } from '@/lib/mediaLibrary/permissions'
import { folderDiskPath } from '@/lib/mediaLibrary/paths'
import { mkdir } from 'fs/promises'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/media/folders')

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || `folder-${Date.now()}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'manage_media' })
  if (!session) return

  await ensureSystemMediaFolders()

  if (req.method === 'GET') {
    const folders = await prisma.mediaFolder.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
    const visible = folders
      .filter((f) => canViewMediaFolder(session.role, f))
      .map((f) => ({
        id: f.id,
        slug: f.slug,
        name: f.name,
        isSystem: f.isSystem,
        sortOrder: f.sortOrder,
        viewRoles: f.viewRoles,
        editRoles: f.editRoles,
        canView: true,
        canEdit: canEditMediaFolder(session.role, f),
        canManageSettings: session.role === 'SUPER_ADMIN',
      }))
    return res.status(200).json({ ok: true, folders: visible })
  }

  if (req.method === 'POST') {
    if (session.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) {
      return res.status(400).json({ ok: false, error: 'name_required' })
    }
    let slug = typeof req.body?.slug === 'string' && req.body.slug.trim() ? slugify(req.body.slug) : slugify(name)
    const existing = await prisma.mediaFolder.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }
    const viewRoles = Array.isArray(req.body?.viewRoles)
      ? (req.body.viewRoles as AdminRole[])
      : (['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR'] as AdminRole[])
    const editRoles = Array.isArray(req.body?.editRoles)
      ? (req.body.editRoles as AdminRole[])
      : (['SUPER_ADMIN'] as AdminRole[])

    try {
      const folder = await prisma.mediaFolder.create({
        data: {
          slug,
          name,
          isSystem: false,
          sortOrder: 100,
          viewRoles,
          editRoles,
        },
      })
      await mkdir(folderDiskPath(folder.slug), { recursive: true })
      return res.status(201).json({ ok: true, folder })
    } catch (error) {
      log.errorWithException('create folder failed', error)
      return res.status(500).json({ ok: false, error: 'create_failed' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
