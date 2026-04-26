import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { deletePropertyMediaFiles } from '@/lib/utils/deletePropertyMediaFiles'
import { createScopedLogger } from '@/lib/logger'
import { lstat, mkdir, readdir, rename, rm, stat, readFile } from 'fs/promises'
import { basename, dirname, join, resolve, sep } from 'path'
import { existsSync } from 'fs'

const cwd = process.cwd()
const PROPERTY_LINK_FILE = '.sgip-property-link.json'
const allowedBases = [
  '/uploads',
  join(cwd, 'public', 'uploads'),
]

const VALID_DISTRICTS = ['Beachfront', 'Downtown', 'Dubai Hills', 'Marina Shores', 'The Oasis']
const log = createScopedLogger('api/properties/browse-folders')

function ts(): string {
  return new Date().toISOString()
}

function getRoots(): { name: string; path: string }[] {
  const roots: { name: string; path: string }[] = []
  if (existsSync('/uploads')) {
    roots.push({ name: 'Property folders on server', path: '/uploads' })
  }
  const incoming = join(cwd, 'public', 'uploads', 'incoming')
  if (existsSync(incoming)) {
    roots.push({ name: 'Recent drag-and-drop uploads', path: incoming })
  }
  return roots
}

function resolveAllowedPath(inputPath: string): string {
  const resolved = resolve(inputPath)
  const allowed = allowedBases.some(
    (base) => resolved === base || resolved.startsWith(base + sep)
  )
  if (!allowed) {
    throw new Error('Path not allowed')
  }
  return resolved
}

function parseFolderName(folderName: string): { district: string | null; propertyName: string } {
  const parts = folderName.split(' - ').map((s) => s.trim())
  if (parts.length >= 2) {
    const district = parts[0]
    const propertyName = parts.slice(1).join(' - ')
    if (VALID_DISTRICTS.includes(district)) {
      return { district, propertyName }
    }
  }
  return { district: null, propertyName: folderName }
}

async function readLinkedPropertyIdsFromFolder(folderPath: string): Promise<string[]> {
  try {
    const markerPath = join(folderPath, PROPERTY_LINK_FILE)
    const raw = await readFile(markerPath, 'utf8')
    const parsed = JSON.parse(raw) as { propertyId?: string; propertyIds?: unknown }
    const ids = new Set<string>()
    if (typeof parsed.propertyId === 'string' && parsed.propertyId.trim()) {
      ids.add(parsed.propertyId.trim())
    }
    if (Array.isArray(parsed.propertyIds)) {
      for (const id of parsed.propertyIds) {
        if (typeof id === 'string' && id.trim()) ids.add(id.trim())
      }
    }
    return Array.from(ids)
  } catch {
    return []
  }
}

async function resolveLinkedPropertyIdsByFolderName(folderPath: string): Promise<string[]> {
  const folderName = basename(folderPath)
  const { district, propertyName } = parseFolderName(folderName)
  const where = district
    ? {
        title: { equals: propertyName, mode: 'insensitive' as const },
        district: { equals: district, mode: 'insensitive' as const },
      }
    : {
        title: { equals: propertyName, mode: 'insensitive' as const },
      }
  const matches = await prisma.property.findMany({
    where,
    select: { id: true },
    take: 10,
  })
  return matches.map((m: { id: string }) => m.id)
}

async function resolveLinkedPropertyIds(folderPath: string): Promise<string[]> {
  const fromMarker = await readLinkedPropertyIdsFromFolder(folderPath)
  if (fromMarker.length > 0) return fromMarker
  return resolveLinkedPropertyIdsByFolderName(folderPath)
}

async function deletePropertyAndMedia(propertyId: string): Promise<{ deleted: boolean; reason?: string }> {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        images: { select: { url: true } },
        files: { select: { url: true } },
        floorPlans: { select: { url: true } },
      },
    })
    if (!property) {
      return { deleted: false, reason: 'not-found' }
    }
    const mediaUrls = [
      ...property.images.map((i: { url: string }) => i.url),
      ...property.files.map((f: { url: string }) => f.url),
      ...property.floorPlans.map((fp: { url: string }) => fp.url),
    ]
    // Delete media first; only then remove DB record to avoid orphaned disk files.
    await deletePropertyMediaFiles(mediaUrls)
    await prisma.property.delete({ where: { id: propertyId } })
    return { deleted: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return { deleted: false, reason: message }
  }
}

async function listPath(normalizedPath: string | null): Promise<{
  roots: { name: string; path: string }[]
  folders: { name: string; path: string }[]
  files: { name: string; path: string; size: number }[]
  parentPath: string | null
  currentPath: string
}> {
  if (!normalizedPath) {
    return {
      roots: getRoots(),
      folders: [],
      files: [],
      parentPath: null,
      currentPath: '',
    }
  }

  const resolved = resolveAllowedPath(normalizedPath)
  if (!existsSync(resolved)) {
    throw new Error('Folder not found')
  }

  const entries = await readdir(resolved, { withFileTypes: true })
  const folders = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => ({
      name: entry.name,
      path: join(resolved, entry.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const files = (
    await Promise.all(
      entries
        .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
        .map(async (entry) => {
          const filePath = join(resolved, entry.name)
          const fileStats = await stat(filePath)
          return {
            name: entry.name,
            path: filePath,
            size: fileStats.size,
          }
        })
    )
  ).sort((a, b) => a.name.localeCompare(b.name))

  const parentPath = allowedBases.includes(resolved) ? null : resolve(dirname(resolved))
  const normalizedParent = parentPath ? resolveAllowedPath(parentPath) : null

  return {
    roots: [],
    folders,
    files,
    parentPath: normalizedParent,
    currentPath: resolved,
  }
}

async function handleManageAction(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body as {
    action?: 'create_folder' | 'rename' | 'delete' | 'move'
    path?: string
    parentPath?: string
    name?: string
    newName?: string
    targetPath?: string
    deleteLinkedPropertyData?: boolean
  } | null
  const action = body?.action

  if (!action) {
    return res.status(400).json({ message: 'Action is required' })
  }

  if (action === 'create_folder') {
    const parentPath = body?.parentPath?.trim()
    const name = body?.name?.trim()
    if (!parentPath || !name) {
      return res.status(400).json({ message: 'parentPath and name are required' })
    }
    const safeParent = resolveAllowedPath(parentPath)
    const target = resolveAllowedPath(join(safeParent, name))
    if (existsSync(target)) {
      return res.status(409).json({ message: 'Folder already exists' })
    }
    await mkdir(target, { recursive: false })
    log.info('create_folder', { target })
    return res.status(200).json({ message: 'Folder created' })
  }

  if (action === 'rename') {
    const itemPath = body?.path?.trim()
    const newName = body?.newName?.trim()
    if (!itemPath || !newName) {
      return res.status(400).json({ message: 'path and newName are required' })
    }
    const safeSource = resolveAllowedPath(itemPath)
    const target = resolveAllowedPath(join(dirname(safeSource), newName))
    if (existsSync(target)) {
      return res.status(409).json({ message: 'Target name already exists' })
    }
    await rename(safeSource, target)
    log.info('rename', { from: safeSource, to: target })
    return res.status(200).json({ message: 'Renamed' })
  }

  if (action === 'delete') {
    const itemPath = body?.path?.trim()
    if (!itemPath) {
      return res.status(400).json({ message: 'path is required' })
    }
    const safeTarget = resolveAllowedPath(itemPath)
    const targetStats = await lstat(safeTarget)
    const deleteLinkedPropertyData = body?.deleteLinkedPropertyData !== false

    let linkedFound = 0
    let linkedDeleted = 0
    const linkedDeleteErrors: string[] = []
    if (targetStats.isDirectory() && deleteLinkedPropertyData) {
      const linkedPropertyIds = await resolveLinkedPropertyIds(safeTarget)
      linkedFound = linkedPropertyIds.length
      for (const propertyId of linkedPropertyIds) {
        const result = await deletePropertyAndMedia(propertyId)
        if (result.deleted) {
          linkedDeleted++
        } else if (result.reason && result.reason !== 'not-found') {
          linkedDeleteErrors.push(result.reason)
        }
      }
      if (linkedDeleteErrors.length > 0) {
        throw new Error(`Failed to delete linked properties/media: ${linkedDeleteErrors.join('; ')}`)
      }
      if (linkedDeleted !== linkedFound) {
        throw new Error(`Linked property deletion mismatch: deleted ${linkedDeleted} of ${linkedFound}`)
      }
    }

    // Do not use force=true here: deletion problems must fail the request.
    await rm(safeTarget, { recursive: targetStats.isDirectory(), force: false, maxRetries: 2, retryDelay: 100 })
    if (existsSync(safeTarget)) {
      throw new Error(`Delete verification failed: ${safeTarget} still exists`)
    }
    log.info('delete', {
      target: safeTarget,
      linkedFound,
      linkedDeleted,
      linkedDeleteErrors: linkedDeleteErrors.length,
    })
    return res.status(200).json({
      message:
        targetStats.isDirectory() && deleteLinkedPropertyData
          ? `Deleted folder. Linked properties removed: ${linkedDeleted}/${linkedFound}.`
          : 'Deleted',
      linkedPropertiesFound: linkedFound,
      linkedPropertiesDeleted: linkedDeleted,
      linkedDeleteErrors,
    })
  }

  if (action === 'move') {
    const itemPath = body?.path?.trim()
    const targetPath = body?.targetPath?.trim()
    if (!itemPath || !targetPath) {
      return res.status(400).json({ message: 'path and targetPath are required' })
    }
    const safeSource = resolveAllowedPath(itemPath)
    const safeTargetDir = resolveAllowedPath(targetPath)
    const destination = resolveAllowedPath(join(safeTargetDir, basename(safeSource)))
    if (existsSync(destination)) {
      return res.status(409).json({ message: 'Destination already exists' })
    }
    await rename(safeSource, destination)
    log.info('move', { from: safeSource, to: destination })
    return res.status(200).json({ message: 'Moved' })
  }

  return res.status(400).json({ message: 'Unsupported action' })
}

/**
 * Lists directories/files under allowed upload roots and provides file manager actions.
 * Allowed bases: /uploads (mounted volume), public/uploads (app writable).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const rawPath = (req.query.path as string) || ''
      const normalized = rawPath.trim() || null
      const data = await listPath(normalized)
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      return await handleManageAction(req, res)
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException
    log.errorWithException('browse-folders request failed', e, { message: e.message, code: e.code })
    const status =
      e.message === 'Path not allowed' ? 400 :
      e.message === 'Folder not found' || e.code === 'ENOENT' ? 404 :
      e.code === 'EEXIST' ? 409 :
      500
    return res.status(status).json({
      message:
        status === 400 ? 'Path not allowed' :
        status === 404 ? 'Folder not found' :
        status === 409 ? 'Target already exists' :
        'Failed to process folder request',
      error: e.message,
    })
  }
}
