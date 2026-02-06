import type { NextApiRequest, NextApiResponse } from 'next'
import { readdir } from 'fs/promises'
import { join, resolve, sep } from 'path'
import { existsSync } from 'fs'

/**
 * Lists directories under allowed upload roots for admin "Browse" folder picker.
 * Allowed bases: /uploads (mounted volume), public/uploads (app writable).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const cwd = process.cwd()
  const allowedBases = [
    '/uploads',
    join(cwd, 'public', 'uploads'),
  ]

  const rawPath = (req.query.path as string) || ''
  const normalized = rawPath.trim() || null

  try {
    // Return root options when no path or empty
    if (!normalized) {
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
      return res.status(200).json({ roots, folders: [], parentPath: null })
    }

    const resolved = resolve(normalized)
    const allowed = allowedBases.some(
      (base) => resolved === base || resolved.startsWith(base + sep)
    )
    if (!allowed) {
      return res.status(400).json({ message: 'Path not allowed' })
    }

    if (!existsSync(resolved)) {
      return res.status(404).json({ message: 'Folder not found' })
    }

    const entries = await readdir(resolved, { withFileTypes: true })
    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => ({
        name: e.name,
        path: join(resolved, e.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const parentPath = allowedBases.includes(resolved) ? null : join(resolved, '..')

    return res.status(200).json({
      roots: [],
      folders,
      parentPath: parentPath !== resolved ? parentPath : null,
      currentPath: resolved,
    })
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException
    console.error('[browse-folders]', e.message)
    return res.status(500).json({
      message: e.code === 'ENOENT' ? 'Folder not found' : 'Failed to list folders',
      error: e.message,
    })
  }
}
