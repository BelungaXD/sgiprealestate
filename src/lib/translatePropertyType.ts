import type { TFunction } from 'i18next'

const PROPERTY_TYPE_ENUMS = new Set([
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

/** Legacy display values stored in DB before enum normalization */
const LEGACY_LABEL_TO_ENUM: Record<string, string> = {
  Пентхаус: 'PENTHOUSE',
  Вилла: 'VILLA',
  Апартаменты: 'APARTMENT',
  Таунхаус: 'TOWNHOUSE',
  Офис: 'OFFICE',
  Студия: 'STUDIO',
  بنتهاوس: 'PENTHOUSE',
  فيلا: 'VILLA',
  شقة: 'APARTMENT',
  'تاون هاوس': 'TOWNHOUSE',
  مكتب: 'OFFICE',
  استوديو: 'STUDIO',
}

/**
 * Maps Prisma `PropertyType` (or legacy localized labels) to `properties.json` `types.*`.
 */
export function translatePropertyType(
  rawType: string,
  t: TFunction<'properties'>
): string {
  const trimmed = rawType.trim()
  const upper = trimmed.toUpperCase()
  const enumValue = PROPERTY_TYPE_ENUMS.has(upper)
    ? upper
    : LEGACY_LABEL_TO_ENUM[trimmed]
  if (enumValue) {
    return t(`types.${enumValue.toLowerCase()}`)
  }
  return rawType
}
