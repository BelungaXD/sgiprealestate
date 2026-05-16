import type { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { requireAdminSession } from '@/lib/adminAuth'
import { canViewMediaFolder, canEditMediaFolder } from '@/lib/mediaLibrary/permissions'
import { assetPublicUrl, folderDiskPath } from '@/lib/mediaLibrary/paths'
import { mediaLibraryUsedBytes, mediaStorageLimitBytes } from '@/lib/mediaLibrary/storage'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/media/assets')

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'manage_media' })
  if (!session) return

  if (req.method === 'GET') {
    const folderId = typeof req.query.folderId === 'string' ? req.query.folderId : ''
    if (!folderId) {
      return res.status(400).json({ ok: false, error: 'folder_id_required' })
    }
    const folder = await prisma.mediaFolder.findUnique({ where: { id: folderId } })
    if (!folder || !canViewMediaFolder(session.role, folder)) {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }
    const assets = await prisma.mediaAsset.findMany({
      where: { folderId },
      orderBy: { createdAt: 'desc' },
    })
    return res.status(200).json({
      ok: true,
      assets: assets.map((a) => ({
        id: a.id,
        folderId: a.folderId,
        originalName: a.originalName,
        url: a.url,
        sizeBytes: a.sizeBytes,
        mimeType: a.mimeType,
        createdAt: a.createdAt,
        canDelete: canEditMediaFolder(session.role, folder),
      })),
      canEdit: canEditMediaFolder(session.role, folder),
    })
  }

  if (req.method === 'POST') {
    const folderId = typeof req.body?.folderId === 'string' ? req.body.folderId : ''
    const file = typeof req.body?.file === 'string' ? req.body.file : ''
    const filename = typeof req.body?.filename === 'string' ? req.body.filename : ''
    if (!folderId || !file || !filename) {
      return res.status(400).json({ ok: false, error: 'invalid_payload' })
    }

    const folder = await prisma.mediaFolder.findUnique({ where: { id: folderId } })
    if (!folder || !canEditMediaFolder(session.role, folder)) {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }

    const used = await mediaLibraryUsedBytes()
    const limit = mediaStorageLimitBytes()

    let buffer: Buffer
    let mimeType: string | null = null
    if (file.startsWith('data:')) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(file)
      if (!match) {
        return res.status(400).json({ ok: false, error: 'invalid_file' })
      }
      mimeType = match[1]
      buffer = Buffer.from(match[2], 'base64')
    } else {
      return res.status(400).json({ ok: false, error: 'invalid_file' })
    }

    if (used + buffer.length > limit) {
      return res.status(413).json({ ok: false, error: 'storage_limit_exceeded' })
    }

    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFilename = `${Date.now()}-${sanitized}`
    const diskDir = folderDiskPath(folder.slug)
    await mkdir(diskDir, { recursive: true })
    const diskPath = join(diskDir, uniqueFilename)
    await writeFile(diskPath, buffer)

    const url = assetPublicUrl(folder.slug, uniqueFilename)
    const asset = await prisma.mediaAsset.create({
      data: {
        folderId,
        filename: uniqueFilename,
        originalName: filename,
        url,
        sizeBytes: buffer.length,
        mimeType,
        uploadedByAdminId: session.adminId ?? undefined,
      },
    })

    return res.status(201).json({ ok: true, asset })
  }

  if (req.method === 'DELETE') {
    const assetId = typeof req.body?.assetId === 'string' ? req.body.assetId : ''
    if (!assetId) {
      return res.status(400).json({ ok: false, error: 'asset_id_required' })
    }
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
      include: { folder: true },
    })
    if (!asset || !canEditMediaFolder(session.role, asset.folder)) {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }

    try {
      const diskPath = join(folderDiskPath(asset.folder.slug), asset.filename)
      await unlink(diskPath).catch(() => undefined)
      await prisma.mediaAsset.delete({ where: { id: assetId } })
      return res.status(200).json({ ok: true })
    } catch (error) {
      log.errorWithException('delete asset failed', error)
      return res.status(500).json({ ok: false, error: 'delete_failed' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
