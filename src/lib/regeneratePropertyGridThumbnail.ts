import { mkdir } from 'fs/promises'
import { basename, dirname, join } from 'path'
import { existsSync } from 'fs'
import { normalizeUploadUrl } from '@/lib/utils/imageUrl'
import { uploadUrlToSafeAbsolutePath } from '@/lib/utils/deletePropertyMediaFiles'
import { writePropertyGridListingThumbnail } from '@/lib/propertyThumbnails'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('lib/regeneratePropertyGridThumbnail')

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i

/**
 * Writes a single grid-card WebP under `images/thumbnails/` for the main listing photo.
 * Only local files under `public/uploads/properties/images/` (not `thumbnails/`).
 */
export async function regenerateGridListingThumbnailForImageUrl(
  rawUrl: string | null | undefined
): Promise<boolean> {
  if (!rawUrl || typeof rawUrl !== 'string') return false
  const trimmed = rawUrl.trim()
  if (!trimmed || !IMAGE_EXT.test(trimmed)) return false

  const normalized = normalizeUploadUrl(trimmed) || trimmed
  const mainAbs = uploadUrlToSafeAbsolutePath(normalized)
  if (!mainAbs || !existsSync(mainAbs)) {
    log.warn('main image missing or not a local property path', { url: trimmed })
    return false
  }

  const n = mainAbs.replace(/\\/g, '/')
  if (!n.includes('/properties/images/') || n.includes('/properties/images/thumbnails/')) {
    return false
  }

  const thumbPath = join(dirname(mainAbs), 'thumbnails', basename(mainAbs))
  try {
    await mkdir(dirname(thumbPath), { recursive: true })
    await writePropertyGridListingThumbnail(mainAbs, thumbPath)
    log.info('grid listing thumbnail written', { main: mainAbs })
    return true
  } catch (e: unknown) {
    log.warn('grid listing thumbnail failed', {
      error: e instanceof Error ? e.message : String(e),
      main: mainAbs,
    })
    return false
  }
}
