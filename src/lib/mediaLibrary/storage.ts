import { prisma } from '@/lib/prisma'

const DEFAULT_LIMIT_GB = 10

export function mediaStorageLimitBytes(): number {
  const raw = process.env.MEDIA_STORAGE_LIMIT_GB?.trim()
  const gb = raw ? Number.parseFloat(raw) : DEFAULT_LIMIT_GB
  if (!Number.isFinite(gb) || gb <= 0) {
    return DEFAULT_LIMIT_GB * 1024 * 1024 * 1024
  }
  return Math.floor(gb * 1024 * 1024 * 1024)
}

export async function mediaLibraryUsedBytes(): Promise<number> {
  const agg = await prisma.mediaAsset.aggregate({ _sum: { sizeBytes: true } })
  return agg._sum.sizeBytes ?? 0
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
