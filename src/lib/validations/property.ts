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
  title: z.string().min(1, 'Название обязательно').max(200, 'Название слишком длинное'),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов').max(5000, 'Описание слишком длинное'),
  type: PropertyTypeEnum,
  price: z.number().positive('Цена должна быть положительным числом'),
  currency: z.string().default('AED'),
  status: PropertyStatusEnum.default('AVAILABLE'),

  // Specifications
  areaSqm: z.number().positive('Площадь должна быть положительным числом'),
  bedrooms: z.number().int().min(0, 'Количество спален не может быть отрицательным'),
  bathrooms: z.number().int().min(0, 'Количество ванных не может быть отрицательным'),
  parking: z.number().int().min(0).optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  completionDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),

  // Location
  address: z.string().min(1, 'Адрес обязателен'),
  city: z.string().min(1, 'Город обязателен'),
  district: z.string().min(1, 'Район обязателен'),
  areaId: z.string().min(1, 'Район из списка обязателен'),
  developerId: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),

  // Features
  features: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),

  // SEO
  slug: z.string().min(1, 'Slug обязателен'),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),

  // Flags
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
})

export type PropertyFormData = z.infer<typeof propertySchema>

