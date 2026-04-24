import { writeFile } from 'fs/promises'
import sharp from 'sharp'

/** Property listing card thumbnails: cap file size (bytes) for fast grid loads. */
export const MAX_PROPERTY_LISTING_THUMBNAIL_BYTES = 40 * 1024

/**
 * Write a WebP listing thumbnail under the byte budget by stepping down size/quality.
 * Same basename as the main image, under images/thumbnails/.
 */
function sharpSource(input: string | Buffer): sharp.Sharp {
  return typeof input === 'string' ? sharp(input) : sharp(input)
}

async function tryEncode(
  input: string | Buffer,
  maxSide: number,
  quality: number
): Promise<Buffer> {
  return sharpSource(input)
    .rotate()
    .resize(maxSide, maxSide, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toBuffer()
}

export async function writePropertyListingThumbnail(
  input: string | Buffer,
  outPath: string,
  maxBytes: number = MAX_PROPERTY_LISTING_THUMBNAIL_BYTES
): Promise<void> {
  const maxSides = [128, 96, 72, 56, 48, 40, 32, 24]

  for (const maxSide of maxSides) {
    let lo = 5
    let hi = 82
    let best: Buffer | null = null
    for (let i = 0; i < 8; i++) {
      if (lo > hi) break
      const q = (lo + hi) >> 1
      const buf = await tryEncode(input, maxSide, q)
      if (buf.length <= maxBytes) {
        best = buf
        lo = q + 1
      } else {
        hi = q - 1
      }
    }
    if (best) {
      await writeFile(outPath, best)
      return
    }
  }

  const last = await tryEncode(input, 16, 5)
  await writeFile(outPath, last)
}
