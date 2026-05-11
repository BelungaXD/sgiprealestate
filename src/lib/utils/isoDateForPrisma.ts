/**
 * Safe DateTime for Prisma: invalid / empty strings become null (avoids PrismaClientValidationError on Invalid Date).
 */
export function parseIsoDateForPrisma(value: unknown): Date | null {
  if (value == null) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const s = String(value).trim()
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Prisma rejects `undefined` in `data`; omit those keys (null stays). */
export function omitUndefinedShallow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row }
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k]
  }
  return out as T
}

/**
 * Optional Json `coordinates` on create: omit key when unset (DB NULL).
 * Do not pass JS `null` — Prisma Json fields require DbNull or omitted key.
 */
export function finiteLatLngOrUndefined(
  v: { lat: number; lng: number } | null | undefined
): { lat: number; lng: number } | undefined {
  if (!v || typeof v.lat !== 'number' || typeof v.lng !== 'number') return undefined
  if (!Number.isFinite(v.lat) || !Number.isFinite(v.lng)) return undefined
  return { lat: v.lat, lng: v.lng }
}
