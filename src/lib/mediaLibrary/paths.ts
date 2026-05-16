import { join } from 'path'
import { existsSync } from 'fs'

export function mediaLibraryRoot(): string {
  if (existsSync('/uploads/media-library')) {
    return '/uploads/media-library'
  }
  return join(process.cwd(), 'public', 'uploads', 'media-library')
}

export function folderDiskPath(folderSlug: string): string {
  const safe = folderSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  return join(mediaLibraryRoot(), safe)
}

export function assetPublicUrl(folderSlug: string, filename: string): string {
  return `/uploads/media-library/${folderSlug}/${filename}`
}
