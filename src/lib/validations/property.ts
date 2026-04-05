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

export const propertySchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
    description: z
      .string()
      .max(5000, 'Description is too long')
      .optional()
      .nullable(),
    type: PropertyTypeEnum.optional(),
    listingMarket: ListingMarketEnum.default('PRIMARY'),
    price: z.number().positive('Price must be a positive number'),
    currency: z.string().default('AED'),
    status: PropertyStatusEnum.default('AVAILABLE'),

    areaSqm: z.number().positive('Area must be a positive number'),
    bedrooms: z.number().int().min(0, 'Number of bedrooms cannot be negative'),
    bathrooms: z.number().int().min(0, 'Number of bathrooms cannot be negative'),
    parking: z.number().int().min(0).optional(),
    floor: z.number().int().optional(),
    totalFloors: z.number().int().positive().optional(),
    yearBuilt: z.number().int().min(1800).max(2100).optional(),
    completionDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    paymentPlan: z.string().max(20000).optional().nullable(),
    occupancyStatus: z
      .union([OccupancyStatusEnum, z.literal('')])
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    district: z.string().min(1, 'District is required'),
    areaId: z.string().optional().nullable(),
    developerId: z.string().optional().nullable(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),

    features: z.array(z.string()).default([]),
    amenities: z.array(z.string()).default([]),

    slug: z.string().min(1, 'Slug is required'),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),

    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
  })

export type PropertyFormData = z.infer<typeof propertySchema>
