/** Tolerate stale Prisma clients or DB columns missing on developers table. */
export const hasMissingDeveloperColumn = (
  error: unknown,
  column: string
) => {
  if (!error || typeof error !== 'object') return false

  const prismaError = error as {
    code?: string
    meta?: { column?: string }
    message?: string
  }
  const qualified = `developers.${column}`

  return (
    prismaError.code === 'P2022' &&
    (prismaError.meta?.column === qualified || prismaError.message?.includes(qualified))
  )
}

export const hasUnknownDeveloperPrismaField = (error: unknown, field: string) => {
  if (!error || typeof error !== 'object') return false
  const message = (error as { message?: string }).message ?? ''
  return (
    message.includes(`Unknown field \`${field}\``) ||
    message.includes(`Unknown argument \`${field}\``)
  )
}

export const isMissingDeveloperFounded = (error: unknown) =>
  hasUnknownDeveloperPrismaField(error, 'founded') ||
  hasMissingDeveloperColumn(error, 'founded')

export const isMissingDeveloperIsActive = (error: unknown) =>
  hasUnknownDeveloperPrismaField(error, 'isActive') ||
  hasMissingDeveloperColumn(error, 'isActive')

export const isMissingDeveloperNameLocales = (error: unknown) =>
  hasUnknownDeveloperPrismaField(error, 'nameEn') ||
  hasUnknownDeveloperPrismaField(error, 'nameRu') ||
  hasUnknownDeveloperPrismaField(error, 'nameAr') ||
  hasMissingDeveloperColumn(error, 'nameEn') ||
  hasMissingDeveloperColumn(error, 'nameRu') ||
  hasMissingDeveloperColumn(error, 'nameAr')

const LOCALE_CONTENT_DB_COLUMNS = [
  'nameRu',
  'nameAr',
  'descriptionRu',
  'descriptionAr',
  'specialtiesRu',
  'specialtiesAr',
  'notableProjectsRu',
  'notableProjectsAr',
] as const

const LOCALE_CONTENT_PRISMA_FIELDS = [
  'nameRu',
  'nameAr',
  'descriptionRu',
  'descriptionAr',
  'specialtiesRu',
  'specialtiesAr',
  'notableProjectsRu',
  'notableProjectsAr',
] as const

/** DB column missing (P2022) — safe to retry without locale fields. */
export const isMissingDeveloperLocaleContentColumn = (error: unknown) =>
  LOCALE_CONTENT_DB_COLUMNS.some((column) => hasMissingDeveloperColumn(error, column))

/** Stale generated client — regenerate and restart, do not treat as missing DB columns. */
export const isStaleDeveloperLocalePrismaClient = (error: unknown) =>
  LOCALE_CONTENT_PRISMA_FIELDS.some((field) => hasUnknownDeveloperPrismaField(error, field))

/** Read paths: tolerate missing DB columns or outdated Prisma client. */
export const isMissingDeveloperLocaleContent = (error: unknown) =>
  isMissingDeveloperLocaleContentColumn(error) ||
  isStaleDeveloperLocalePrismaClient(error) ||
  isMissingDeveloperNameLocales(error)
