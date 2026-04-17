import type { NextApiRequest, NextApiResponse } from 'next'
import { lstat, mkdir, readdir, rename, rm, stat } from 'fs/promises'
import { basename, dirname, join, resolve, sep } from 'path'
import { existsSync } from 'fs'

const cwd = process.cwd()
const allowedBases = [
  '/uploads',
  join(cwd, 'public', 'uploads'),
]

function ts(): string {
  return new Date().toISOString()
}

function getRoots(): { name: string; path: string }[] {
  const roots: { name: string; path: string }[] = []
  if (existsSync('/uploads')) {
    roots.push({ name: 'Server uploads (scp)', path: '/uploads' })
  }
  const publicUploads = join(cwd, 'public', 'uploads')
  if (existsSync(publicUploads)) {
    roots.push({ name: 'App uploads', path: publicUploads })
  }
  const incoming = join(cwd, 'public', 'uploads', 'incoming')
  if (existsSync(incoming)) {
    roots.push({ name: 'Recent uploads (incoming)', path: incoming })
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
    console.info(`[${ts()}] [browse-folders] create_folder ${target}`)
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
    console.info(`[${ts()}] [browse-folders] rename ${safeSource} -> ${target}`)
    return res.status(200).json({ message: 'Renamed' })
  }

  if (action === 'delete') {
    const itemPath = body?.path?.trim()
    if (!itemPath) {
      return res.status(400).json({ message: 'path is required' })
    }
    const safeTarget = resolveAllowedPath(itemPath)
    const targetStats = await lstat(safeTarget)
    await rm(safeTarget, { recursive: targetStats.isDirectory(), force: false })
    console.info(`[${ts()}] [browse-folders] delete ${safeTarget}`)
    return res.status(200).json({ message: 'Deleted' })
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
    console.info(`[${ts()}] [browse-folders] move ${safeSource} -> ${destination}`)
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
    console.error(`[${ts()}] [browse-folders] ${e.message}`)
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
