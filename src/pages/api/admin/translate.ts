import type { NextApiRequest, NextApiResponse } from 'next'
import { createScopedLogger } from '@/lib/logger'
import { isAdminSessionValid } from '@/lib/adminSession'
import {
  isGeminiTranslateConfigured,
  translateTexts,
  type ContentLocale,
} from '@/lib/geminiTranslate'

const log = createScopedLogger('api/admin/translate')

const MAX_TEXTS = 20
const MAX_TOTAL_CHARS = 8000
const LOCALES: ContentLocale[] = ['en', 'ru', 'ar']

function isLocale(value: unknown): value is ContentLocale {
  return typeof value === 'string' && LOCALES.includes(value as ContentLocale)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!isAdminSessionValid(req)) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (!isGeminiTranslateConfigured()) {
    return res.status(503).json({ message: 'Translation service is not configured' })
  }

  const startedAt = Date.now()
  const { sourceLocale, targetLocales, texts, textKind } = req.body ?? {}
  const normalizedTextKind =
    textKind === 'tag' || textKind === 'listing' ? textKind : 'listing'

  if (!isLocale(sourceLocale)) {
    return res.status(400).json({ message: 'Invalid sourceLocale' })
  }

  if (!Array.isArray(targetLocales) || targetLocales.length === 0) {
    return res.status(400).json({ message: 'targetLocales must be a non-empty array' })
  }

  if (!targetLocales.every(isLocale)) {
    return res.status(400).json({ message: 'Invalid targetLocales' })
  }

  if (!Array.isArray(texts)) {
    return res.status(400).json({ message: 'texts must be an array' })
  }

  if (texts.length > MAX_TEXTS) {
    return res.status(400).json({ message: `Maximum ${MAX_TEXTS} texts per request` })
  }

  const normalizedTexts = texts.map((t: unknown) => String(t ?? '').trim())
  const totalChars = normalizedTexts.reduce((sum, t) => sum + t.length, 0)
  if (totalChars > MAX_TOTAL_CHARS) {
    return res.status(400).json({ message: `Maximum ${MAX_TOTAL_CHARS} characters per request` })
  }

  const filteredTargets = (targetLocales as ContentLocale[]).filter((l) => l !== sourceLocale)
  if (filteredTargets.length === 0) {
    return res.status(200).json({ translations: {} })
  }

  if (normalizedTexts.every((t) => !t)) {
    const empty: Record<string, string[]> = {}
    for (const locale of filteredTargets) {
      empty[locale] = normalizedTexts.map(() => '')
    }
    return res.status(200).json({ translations: empty })
  }

  try {
    const translations = await translateTexts({
      texts: normalizedTexts,
      sourceLocale,
      targetLocales: filteredTargets,
      textKind: normalizedTextKind,
    })
    log.info('translate request ok', {
      at: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      sourceLocale,
      targetLocales: filteredTargets,
      textCount: normalizedTexts.length,
    })
    return res.status(200).json({ translations })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Translation failed'
    const status = message.includes('not configured') ? 503 : 502
    log.error('translate request failed', {
      at: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt,
      error: message,
    })
    return res.status(status).json({ message })
  }
}
