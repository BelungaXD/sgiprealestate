/**
 * Maps DB developer fields (English canonical) + RU/AR columns for a Next.js route locale.
 */

export type DeveloperLocaleSource = {
  name?: string | null
  nameEn?: string | null
  nameRu?: string | null
  nameAr?: string | null
  description?: string | null
  descriptionEn?: string | null
  descriptionRu?: string | null
  descriptionAr?: string | null
  specialties?: string[]
  specialtiesRu?: string[]
  specialtiesAr?: string[]
  notableProjects?: string[]
  notableProjectsRu?: string[]
  notableProjectsAr?: string[]
}

function pick(s: string | null | undefined): string | null {
  const t = (s ?? '').trim()
  return t ? t : null
}

function pickArray(items: string[] | null | undefined): string[] {
  if (!Array.isArray(items)) return []
  return items.map((v) => v.trim()).filter(Boolean)
}

export function localizedDeveloperContent(
  d: DeveloperLocaleSource,
  locale: string | undefined
): {
  name: string
  description: string
  specialties: string[]
  notableProjects: string[]
} {
  const loc = locale === 'ru' || locale === 'ar' ? locale : 'en'
  const canonicalName = pick(d.name) ?? pick(d.nameEn) ?? ''
  const fallbackDesc =
    pick(d.description) ?? pick(d.descriptionEn) ?? ''
  const fallbackSpecialties = pickArray(d.specialties)
  const fallbackProjects = pickArray(d.notableProjects)

  if (loc === 'ru') {
    return {
      name: canonicalName,
      description: pick(d.descriptionRu) ?? fallbackDesc,
      specialties:
        pickArray(d.specialtiesRu).length > 0
          ? pickArray(d.specialtiesRu)
          : fallbackSpecialties,
      notableProjects:
        pickArray(d.notableProjectsRu).length > 0
          ? pickArray(d.notableProjectsRu)
          : fallbackProjects,
    }
  }
  if (loc === 'ar') {
    return {
      name: canonicalName,
      description: pick(d.descriptionAr) ?? fallbackDesc,
      specialties:
        pickArray(d.specialtiesAr).length > 0
          ? pickArray(d.specialtiesAr)
          : fallbackSpecialties,
      notableProjects:
        pickArray(d.notableProjectsAr).length > 0
          ? pickArray(d.notableProjectsAr)
          : fallbackProjects,
    }
  }
  return {
    name: canonicalName,
    description: fallbackDesc,
    specialties: fallbackSpecialties,
    notableProjects: fallbackProjects,
  }
}
