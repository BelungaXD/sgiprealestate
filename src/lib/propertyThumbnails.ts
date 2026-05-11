import { writeFile } from 'fs/promises'

/** Legacy micro thumbs (imports / old flows): very small byte cap. */
export const MAX_PROPERTY_LISTING_THUMBNAIL_BYTES = 40 * 1024

/** Grid card preview (~full column × h-64): one WebP per cover image after property save. */
export const MAX_PROPERTY_GRID_LISTING_BYTES = 320 * 1024

/**
 * Write a WebP listing thumbnail under the byte budget by stepping down size/quality.
 * Same basename as the main image, under images/thumbnails/.
 */
type SharpFactory = (input?: Buffer | string) => {
  rotate: () => ReturnType<SharpFactory>
  resize: (
    width: number,
    height: number,
    options: { fit: 'inside'; withoutEnlargement: boolean }
  ) => ReturnType<SharpFactory>
  webp: (options: { quality: number; effort: number; smartSubsample: boolean }) => ReturnType<SharpFactory>
  toBuffer: () => Promise<Buffer>
}

let sharpFactoryPromise: Promise<SharpFactory | null> | null = null

async function getSharpFactory(): Promise<SharpFactory | null> {
  if (!sharpFactoryPromise) {
    sharpFactoryPromise = import('sharp')
      .then((mod) => {
        const sharpCandidate = (mod as { default?: unknown }).default ?? mod
        return typeof sharpCandidate === 'function' ? (sharpCandidate as SharpFactory) : null
      })
      .catch(() => null)
  }
  return sharpFactoryPromise
}

async function sharpSource(input: string | Buffer): Promise<ReturnType<SharpFactory>> {
  const sharpFactory = await getSharpFactory()
  if (!sharpFactory) {
    throw new Error('sharp_unavailable')
  }
  return sharpFactory(input)
}

async function tryEncode(
  input: string | Buffer,
  maxSide: number,
  quality: number
): Promise<Buffer> {
  const source = await sharpSource(input)
  return source
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

/**
 * Listing grid / card hero: sharp WebP sized for ~256px height at retina, without micro-blur.
 * Same path convention as {@link writePropertyListingThumbnail} (`images/thumbnails/<basename>`).
 */
export async function writePropertyGridListingThumbnail(
  input: string | Buffer,
  outPath: string,
  maxBytes: number = MAX_PROPERTY_GRID_LISTING_BYTES
): Promise<void> {
  const maxSides = [960, 800, 672, 560, 480]

  for (const maxSide of maxSides) {
    let lo = 40
    let hi = 92
    let best: Buffer | null = null
    for (let i = 0; i < 10; i++) {
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

  const fallback = await tryEncode(input, 480, 72)
  await writeFile(outPath, fallback)
}
