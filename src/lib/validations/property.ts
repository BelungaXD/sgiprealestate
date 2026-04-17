import { z } from 'zod'

export const PropertyTypeEnum = z.enum([
  'APARTMENT',
  'VILLA',
  'TOWNHOUSE',
  'PENTHOUSE',
  'STUDIO',
  'OFFICE',
  'RETAIL',
  'WAREHOUSE',
  'LAND',
])

export const PropertyStatusEnum = z.enum([
  'AVAILABLE',
  'SOLD',
  'RENTED',
  'RESERVED',
  'UNAVAILABLE',
])

export const ListingMarketEnum = z.enum(['PRIMARY', 'SECONDARY'])

export const OccupancyStatusEnum = z.enum(['VACANT', 'TENANTED'])

const asFiniteNumber = (v: unknown): number | undefined => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}

const numOrZero = z.preprocess(
  (v) => {
    const n = asFiniteNumber(v)
    return n === undefined ? 0 : n
  },
  z.number()
)

const optionalNonNegInt = z.preprocess(
  (v) => {
    const n = asFiniteNumber(v)
    if (n === undefined) return undefined
    const x = Math.trunc(n)
    return x >= 0 ? x : undefined
  },
  z.number().int().min(0).optional()
)

const optionalPositiveInt = z.preprocess(
  (v) => {
    const n = asFiniteNumber(v)
    if (n === undefined) return undefined
    const x = Math.trunc(n)
    return x > 0 ? x : undefined
  },
  z.number().int().positive().optional()
)

const optionalYear = z.preprocess(
  (v) => {
    const n = asFiniteNumber(v)
    if (n === undefined) return undefined
    const y = Math.trunc(n)
    if (y < 1800 || y > 2100) return undefined
    return y
  },
  z.number().int().optional()
)

export const propertySchema = z
  .object({
    title: z.string().max(200).optional().default(''),
    description: z
      .string()
      .max(5000, 'Description is too long')
      .optional()
      .nullable(),
    type: PropertyTypeEnum.optional(),
    listingMarket: ListingMarketEnum.default('PRIMARY'),
    price: numOrZero,
    currency: z.preprocess(
      (v) => {
        if (v === '' || v === null || v === undefined) return 'AED'
        const s = String(v).trim()
        return s || 'AED'
      },
      z.string().max(16)
    ),
    status: PropertyStatusEnum.default('AVAILABLE'),

    areaSqm: numOrZero,
    bedrooms: z.preprocess(
      (v) => {
        const n = asFiniteNumber(v)
        if (n === undefined) return 0
        const x = Math.trunc(n)
        return x >= 0 ? x : 0
      },
      z.number().int().min(0)
    ),
    bathrooms: z.preprocess(
      (v) => {
        const n = asFiniteNumber(v)
        if (n === undefined) return 0
        const x = Math.trunc(n)
        return x >= 0 ? x : 0
      },
      z.number().int().min(0)
    ),
    parking: optionalNonNegInt,
    floor: optionalNonNegInt,
    totalFloors: optionalPositiveInt,
    yearBuilt: optionalYear,
    completionDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    paymentPlan: z.string().max(20000).optional().nullable(),
    occupancyStatus: z
      .union([OccupancyStatusEnum, z.literal('')])
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

    address: z.string().max(500).optional().default(''),
    city: z.string().max(500).optional().default(''),
    district: z.string().max(500).optional().default(''),
    areaId: z.string().optional().nullable(),
    developerId: z.string().optional().nullable(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
    googleMapsUrl: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((v) => {
        if (v == null || v === undefined) return null
        const t = String(v).trim()
        if (!t) return null
        const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`
        try {
          new URL(withProto)
          return withProto
        } catch {
          return null
        }
      }),

    features: z.array(z.string()).default([]),
    amenities: z.array(z.string()).default([]),

    slug: z.string().max(200).optional().default(''),
    metaTitle: z.string().max(200).optional().nullable(),
    metaDescription: z.string().max(2000).optional().nullable(),

    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
  })

const PROPERTY_API_EXTRA_FIELDS = ['images', 'files'] as const

/** Drops Prisma relation objects and other stray keys so admin save stays JSON-safe. */
export function pickPropertyApiPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set<string>([
    ...Object.keys(propertySchema.shape),
    ...PROPERTY_API_EXTRA_FIELDS,
  ])
  const out: Record<string, unknown> = {}
  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue
    const v = payload[key]
    if (v === undefined) continue
    out[key] = v
  }
  return out
}

export type PropertyFormData = z.infer<typeof propertySchema>
