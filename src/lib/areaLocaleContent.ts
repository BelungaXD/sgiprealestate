/**
 * Maps DB area fields (English canonical) + RU/AR columns for a Next.js route locale.
 */

export type AreaLocaleSource = {
  name?: string | null
  nameEn?: string | null
  nameRu?: string | null
  nameAr?: string | null
  description?: string | null
  descriptionEn?: string | null
  descriptionRu?: string | null
  descriptionAr?: string | null
  tags?: string[]
  tagsRu?: string[]
  tagsAr?: string[]
}

function pick(s: string | null | undefined): string | null {
  const t = (s ?? '').trim()
  return t ? t : null
}

function pickArray(items: string[] | null | undefined): string[] {
  if (!Array.isArray(items)) return []
  return items.map((v) => v.trim()).filter(Boolean)
}

export function localizedAreaContent(
  a: AreaLocaleSource,
  locale: string | undefined
): {
  name: string
  description: string
  tags: string[]
} {
  const loc = locale === 'ru' || locale === 'ar' ? locale : 'en'
  const canonicalName = pick(a.name) ?? pick(a.nameEn) ?? ''
  const fallbackDesc = pick(a.description) ?? pick(a.descriptionEn) ?? ''
  const fallbackTags = pickArray(a.tags)

  if (loc === 'ru') {
    return {
      name: canonicalName,
      description: pick(a.descriptionRu) ?? fallbackDesc,
      tags: pickArray(a.tagsRu).length > 0 ? pickArray(a.tagsRu) : fallbackTags,
    }
  }
  if (loc === 'ar') {
    return {
      name: canonicalName,
      description: pick(a.descriptionAr) ?? fallbackDesc,
      tags: pickArray(a.tagsAr).length > 0 ? pickArray(a.tagsAr) : fallbackTags,
    }
  }
  return {
    name: canonicalName,
    description: fallbackDesc,
    tags: fallbackTags,
  }
}
