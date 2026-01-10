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
  'LAND'
])

export const PropertyStatusEnum = z.enum([
  'AVAILABLE',
  'SOLD',
  'RENTED',
  'RESERVED',
  'UNAVAILABLE'
])

export const propertySchema = z.object({
  // Basic Information
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(10, 'Description must contain at least 10 characters').max(5000, 'Description is too long'),
  type: PropertyTypeEnum.optional(),
  price: z.number().positive('Price must be a positive number'),
  currency: z.string().default('AED'),
  status: PropertyStatusEnum.default('AVAILABLE'),

  // Specifications
  areaSqm: z.number().positive('Area must be a positive number'),
  bedrooms: z.number().int().min(0, 'Number of bedrooms cannot be negative'),
  bathrooms: z.number().int().min(0, 'Number of bathrooms cannot be negative'),
  parking: z.number().int().min(0).optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  completionDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),

  // Location
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  areaId: z.string().optional(),
  developerId: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),

  // Features
  features: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),

  // SEO
  slug: z.string().min(1, 'Slug is required'),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),

  // Flags
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
})

export type PropertyFormData = z.infer<typeof propertySchema>

