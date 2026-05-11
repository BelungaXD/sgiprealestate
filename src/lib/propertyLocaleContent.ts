/**
 * Maps DB `Property` base fields (English) + optional RU/AR columns to strings for a Next.js route locale.
 * English (`title`, `description`, `meta*`) is the canonical fallback when a translation is empty.
 */

export type PropertyLocaleSource = {
  title: string
  titleRu?: string | null
  titleAr?: string | null
  description?: string | null
  descriptionRu?: string | null
  descriptionAr?: string | null
  metaTitle?: string | null
  metaTitleRu?: string | null
  metaTitleAr?: string | null
  metaDescription?: string | null
  metaDescriptionRu?: string | null
  metaDescriptionAr?: string | null
}

function pick(s: string | null | undefined): string | null {
  const t = (s ?? '').trim()
  return t ? t : null
}

export function localizedPropertyContent(
  p: PropertyLocaleSource,
  locale: string | undefined
): {
  title: string
  description: string
  metaTitle: string | null
  metaDescription: string | null
} {
  const loc = locale === 'ru' || locale === 'ar' ? locale : 'en'
  const fallbackTitle = (p.title ?? '').trim()
  const fallbackDesc = (p.description ?? '').trim()
  const fallbackMetaTitle = pick(p.metaTitle)
  const fallbackMetaDesc = pick(p.metaDescription)

  if (loc === 'ru') {
    return {
      title: pick(p.titleRu) ?? fallbackTitle,
      description: pick(p.descriptionRu) ?? fallbackDesc,
      metaTitle: pick(p.metaTitleRu) ?? fallbackMetaTitle,
      metaDescription: pick(p.metaDescriptionRu) ?? fallbackMetaDesc,
    }
  }
  if (loc === 'ar') {
    return {
      title: pick(p.titleAr) ?? fallbackTitle,
      description: pick(p.descriptionAr) ?? fallbackDesc,
      metaTitle: pick(p.metaTitleAr) ?? fallbackMetaTitle,
      metaDescription: pick(p.metaDescriptionAr) ?? fallbackMetaDesc,
    }
  }
  return {
    title: fallbackTitle,
    description: fallbackDesc,
    metaTitle: fallbackMetaTitle,
    metaDescription: fallbackMetaDesc,
  }
}

export function localizedSeoTitleDescription(
  loc: ReturnType<typeof localizedPropertyContent>
): { pageTitle: string; pageDescription: string } {
  return {
    pageTitle: loc.metaTitle?.trim() || loc.title,
    pageDescription: loc.metaDescription?.trim() || loc.description,
  }
}
