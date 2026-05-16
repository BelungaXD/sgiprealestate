export const hasUnknownAreaPrismaField = (error: unknown, field: string) => {
  if (!error || typeof error !== 'object') return false
  const message = (error as { message?: string }).message ?? ''
  return (
    message.includes(`Unknown field \`${field}\``) ||
    message.includes(`Unknown argument \`${field}\``)
  )
}

export const isMissingAreaLocaleContent = (error: unknown) =>
  hasUnknownAreaPrismaField(error, 'nameRu') ||
  hasUnknownAreaPrismaField(error, 'descriptionRu') ||
  hasUnknownAreaPrismaField(error, 'tagsRu')
