import { unlink } from 'fs/promises'
import { basename, dirname, join, relative, resolve, sep } from 'path'
import { createScopedLogger } from '@/lib/logger'

const LOG_SCOPE = 'delete-property-media'
const log = createScopedLogger(`lib/utils/${LOG_SCOPE}`)

function propertiesUploadBase(): string {
  return join(process.cwd(), 'public', 'uploads', 'properties')
}

/**
 * Map a stored media URL to an absolute path under public/uploads.
 * Only paths inside public/uploads/properties are returned (for safe deletion).
 */
export function uploadUrlToSafeAbsolutePath(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  let pathname = url.trim()
  if (!pathname) return null

  if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
    try {
      pathname = new URL(pathname).pathname
    } catch {
      return null
    }
  }

  let relFromUploads: string | null = null
  if (pathname.startsWith('/api/uploads/')) {
    relFromUploads = pathname.slice('/api/uploads/'.length)
  } else if (pathname.startsWith('/uploads/')) {
    relFromUploads = pathname.slice('/uploads/'.length)
  }
  if (!relFromUploads) return null

  let decoded: string
  try {
    decoded = decodeURIComponent(relFromUploads)
  } catch {
    return null
  }

  const segments = decoded.split(/[/\\]/).filter(Boolean)
  if (segments.some((s) => s === '..')) return null

  const abs = resolve(join(process.cwd(), 'public', 'uploads', ...segments))
  const base = resolve(propertiesUploadBase())
  const rel = relative(base, abs)
  if (rel.startsWith('..') || rel === '') return null
  if (abs !== base && !abs.startsWith(base + sep)) return null
  return abs
}

function isMainPropertyImagePath(absPath: string): boolean {
  const n = absPath.replace(/\\/g, '/')
  return (
    n.includes('/uploads/properties/images/') &&
    !n.includes('/uploads/properties/images/thumbnails/')
  )
}

async function unlinkOne(path: string): Promise<void> {
  try {
    await unlink(path)
    log.info('removed', { path })
  } catch (e: unknown) {
    const code = typeof e === 'object' && e !== null && 'code' in e ? (e as NodeJS.ErrnoException).code : undefined
    if (code !== 'ENOENT') {
      log.warn('unlink failed', { path, error: e })
    }
  }
}

/**
 * Deletes on-disk files for property media URLs (images, videos, documents, floor plans).
 * Thumbnails under images/thumbnails are removed when the main image path matches.
 */
export async function deletePropertyMediaFiles(urls: Iterable<string | null | undefined>): Promise<void> {
  const base = resolve(propertiesUploadBase())
  const paths = new Set<string>()

  for (const url of urls) {
    const abs = uploadUrlToSafeAbsolutePath(url || '')
    if (abs) paths.add(abs)
  }

  const thumbCandidates = new Set<string>()
  for (const abs of paths) {
    if (!isMainPropertyImagePath(abs)) continue
    const dir = dirname(abs)
    const file = basename(abs)
    const thumbDir = join(dir, 'thumbnails')
    thumbCandidates.add(join(thumbDir, file))
    thumbCandidates.add(join(thumbDir, `thumb-${file}`))
  }

  for (const p of thumbCandidates) {
    const rp = resolve(p)
    const rel = relative(base, rp)
    if (!rel.startsWith('..') && rel !== '' && (rp === base || rp.startsWith(base + sep))) {
      paths.add(rp)
    }
  }

  for (const p of paths) {
    await unlinkOne(p)
  }
}
