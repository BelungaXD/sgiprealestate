import {
  PROPERTY_SEO_ALIAS_TO_KEY,
  PROPERTY_SEO_CANONICAL_LABELS,
} from '@/lib/propertyTagAliases'

type Locale = 'en' | 'ru' | 'ar'

type LocalizedValue = {
  en: string
  ru: string
  ar: string
}

type MetaInput = {
  title: string
  titleRu?: string | null
  titleAr?: string | null
  description?: string | null
  descriptionRu?: string | null
  descriptionAr?: string | null
  type?: string | null
  city?: string | null
  district?: string | null
  features?: string[] | null
  featuresRu?: string[] | null
  featuresAr?: string[] | null
  amenities?: string[] | null
  amenitiesRu?: string[] | null
  amenitiesAr?: string[] | null
}

type ExistingMeta = {
  metaTitle?: string | null
  metaTitleRu?: string | null
  metaTitleAr?: string | null
  metaDescription?: string | null
  metaDescriptionRu?: string | null
  metaDescriptionAr?: string | null
}

type GeneratedMeta = {
  metaTitle: string
  metaTitleRu: string
  metaTitleAr: string
  metaDescription: string
  metaDescriptionRu: string
  metaDescriptionAr: string
}

const TYPE_ENUM_TO_KEY: Record<string, string> = {
  APARTMENT: 'typeApartment',
  VILLA: 'typeVilla',
  TOWNHOUSE: 'typeTownhouse',
  PENTHOUSE: 'typePenthouse',
  STUDIO: 'typeStudio',
  OFFICE: 'typeOffice',
  RETAIL: 'typeRetail',
  WAREHOUSE: 'typeWarehouse',
  LAND: 'typeLand',
}

const ATTRIBUTE_PRIORITY = [
  'attrLuxury',
  'attrSeaView',
  'attrModern',
  'attrNewBuild',
  'attrFurnished',
  'attrWaterfront',
  'attrInvestment',
  'attrCityView',
] as const

const DISTRICT_PRIORITY = [
  'districtDowntownDubai',
  'districtDubaiMarina',
  'districtPalmJumeirah',
  'districtBusinessBay',
  'districtDubaiCreekHarbour',
  'districtDubaiHills',
  'districtJvc',
  'districtJlt',
] as const

const DEFAULT_TYPE: LocalizedValue = {
  en: 'Property',
  ru: 'Недвижимость',
  ar: 'عقار',
}

function compactSpace(v: string | null | undefined): string {
  return (v ?? '').replace(/\s+/g, ' ').trim()
}

function cleanForLookup(v: string): string {
  return v
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"?<>[\]\\|+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasValue(v: string | null | undefined): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

function toLocaleLabel(key: string, locale: Locale): string {
  const label = PROPERTY_SEO_CANONICAL_LABELS[key]
  if (!label) return ''
  return label[locale] || label.en
}

function truncateByWords(input: string, max: number): string {
  const t = compactSpace(input)
  if (t.length <= max) return t
  const words = t.split(' ')
  let out = ''
  for (const word of words) {
    const next = out ? `${out} ${word}` : word
    if (next.length > max) break
    out = next
  }
  if (!out) return t.slice(0, Math.max(0, max - 1)).trimEnd()
  return out
}

function getTopDistrict(keys: Set<string>): string | null {
  for (const k of DISTRICT_PRIORITY) {
    if (keys.has(k)) return k
  }
  const dynamic = Array.from(keys).find((k) => k.startsWith('district'))
  return dynamic || null
}

function getTopAttributes(keys: Set<string>, limit = 2): string[] {
  const picked: string[] = []
  for (const k of ATTRIBUTE_PRIORITY) {
    if (keys.has(k)) picked.push(k)
    if (picked.length >= limit) return picked
  }
  for (const k of keys) {
    if (picked.length >= limit) break
    if (k.startsWith('attr') && !picked.includes(k)) picked.push(k)
  }
  return picked
}

function extractCanonicalKeys(input: MetaInput): Set<string> {
  const rawSegments = [
    input.title,
    input.titleRu,
    input.titleAr,
    input.description,
    input.descriptionRu,
    input.descriptionAr,
    input.city,
    input.district,
    ...(input.features || []),
    ...(input.featuresRu || []),
    ...(input.featuresAr || []),
    ...(input.amenities || []),
    ...(input.amenitiesRu || []),
    ...(input.amenitiesAr || []),
  ].filter(hasValue)

  const full = ` ${cleanForLookup(rawSegments.join(' '))} `
  const keys = new Set<string>()

  for (const [alias, key] of Object.entries(PROPERTY_SEO_ALIAS_TO_KEY)) {
    const needle = cleanForLookup(alias)
    if (!needle) continue
    if (full.includes(` ${needle} `)) keys.add(key)
  }

  const enumKey = TYPE_ENUM_TO_KEY[(input.type || '').toUpperCase()]
  if (enumKey) keys.add(enumKey)

  return keys
}

function buildLocalizedMeta(
  locale: Locale,
  typeKey: string | null,
  districtKey: string | null,
  attrs: string[],
  fallbackTitle: string
): { title: string; description: string } {
  const typeLabel = typeKey ? toLocaleLabel(typeKey, locale) : DEFAULT_TYPE[locale]
  const districtLabel = districtKey ? toLocaleLabel(districtKey, locale) : ''
  const attrLabels = attrs.map((k) => toLocaleLabel(k, locale)).filter(Boolean)
  const attrsText = attrLabels.slice(0, 2).join(', ')

  if (locale === 'ru') {
    const metaTitleRaw = districtLabel
      ? `${typeLabel} в ${districtLabel} | SGIP Real Estate`
      : `${typeLabel} в Дубае | SGIP Real Estate`
    const metaDescriptionRaw = districtLabel
      ? `${typeLabel} в ${districtLabel}${attrsText ? `, ${attrsText}` : ''}. Актуальные цены, фото и условия покупки от SGIP Real Estate.`
      : `${typeLabel} в Дубае${attrsText ? `, ${attrsText}` : ''}. Актуальные цены, фото и условия покупки от SGIP Real Estate.`
    return {
      title: truncateByWords(metaTitleRaw, 60),
      description: truncateByWords(metaDescriptionRaw, 160),
    }
  }

  if (locale === 'ar') {
    const metaTitleRaw = districtLabel
      ? `${typeLabel} في ${districtLabel} | SGIP Real Estate`
      : `${typeLabel} في دبي | SGIP Real Estate`
    const metaDescriptionRaw = districtLabel
      ? `${typeLabel} في ${districtLabel}${attrsText ? `، ${attrsText}` : ''}. اطّلع على الأسعار والصور وخيارات الشراء مع SGIP Real Estate.`
      : `${typeLabel} في دبي${attrsText ? `، ${attrsText}` : ''}. اطّلع على الأسعار والصور وخيارات الشراء مع SGIP Real Estate.`
    return {
      title: truncateByWords(metaTitleRaw, 60),
      description: truncateByWords(metaDescriptionRaw, 160),
    }
  }

  const metaTitleRaw = districtLabel
    ? `${typeLabel} in ${districtLabel} | SGIP Real Estate`
    : `${typeLabel} in Dubai | SGIP Real Estate`
  const metaDescriptionRaw = districtLabel
    ? `${typeLabel} in ${districtLabel}${attrsText ? `, ${attrsText}` : ''}. See prices, photos and purchase terms with SGIP Real Estate.`
    : `${typeLabel} in Dubai${attrsText ? `, ${attrsText}` : ''}. See prices, photos and purchase terms with SGIP Real Estate.`

  return {
    title: truncateByWords(metaTitleRaw, 60),
    description: truncateByWords(metaDescriptionRaw, 160),
  }
}

function finalTitle(generated: string, fallbackTitle: string): string {
  const g = compactSpace(generated)
  if (g) return g
  const f = compactSpace(fallbackTitle)
  return truncateByWords(f || 'Property | SGIP Real Estate', 60)
}

function finalDescription(generated: string, fallbackDescription: string): string {
  const g = compactSpace(generated)
  if (g) return g
  const f = compactSpace(fallbackDescription)
  return truncateByWords(f || 'Property in Dubai by SGIP Real Estate.', 160)
}

function fillEmpty(manual: string | null | undefined, generated: string): string {
  const m = compactSpace(manual)
  return m || generated
}

export function generateLocalizedMetaIfMissing(
  input: MetaInput,
  existing: ExistingMeta
): GeneratedMeta {
  const keys = extractCanonicalKeys(input)
  const typeKey =
    Array.from(keys).find((k) => k.startsWith('type')) ||
    TYPE_ENUM_TO_KEY[(input.type || '').toUpperCase()] ||
    null
  const districtKey = getTopDistrict(keys)
  const attrs = getTopAttributes(keys, 2)

  const sourceTitleEn = compactSpace(input.title)
  const sourceTitleRu = compactSpace(input.titleRu) || sourceTitleEn
  const sourceTitleAr = compactSpace(input.titleAr) || sourceTitleEn

  const sourceDescEn = compactSpace(input.description)
  const sourceDescRu = compactSpace(input.descriptionRu) || sourceDescEn
  const sourceDescAr = compactSpace(input.descriptionAr) || sourceDescEn

  const en = buildLocalizedMeta('en', typeKey, districtKey, attrs, sourceTitleEn)
  const ru = buildLocalizedMeta('ru', typeKey, districtKey, attrs, sourceTitleRu)
  const ar = buildLocalizedMeta('ar', typeKey, districtKey, attrs, sourceTitleAr)

  return {
    metaTitle: fillEmpty(existing.metaTitle, finalTitle(en.title, sourceTitleEn)),
    metaTitleRu: fillEmpty(existing.metaTitleRu, finalTitle(ru.title, sourceTitleRu)),
    metaTitleAr: fillEmpty(existing.metaTitleAr, finalTitle(ar.title, sourceTitleAr)),
    metaDescription: fillEmpty(
      existing.metaDescription,
      finalDescription(en.description, sourceDescEn)
    ),
    metaDescriptionRu: fillEmpty(
      existing.metaDescriptionRu,
      finalDescription(ru.description, sourceDescRu)
    ),
    metaDescriptionAr: fillEmpty(
      existing.metaDescriptionAr,
      finalDescription(ar.description, sourceDescAr)
    ),
  }
}
