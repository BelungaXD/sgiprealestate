import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('lib/geminiTranslate')

export type ContentLocale = 'en' | 'ru' | 'ar'

export type TranslateTextKind = 'listing' | 'tag'

export type TranslateTextsInput = {
  texts: string[]
  sourceLocale: ContentLocale
  targetLocales: ContentLocale[]
  textKind?: TranslateTextKind
}

export type TranslateTextsResult = Partial<Record<ContentLocale, string[]>>

const DEFAULT_MODEL = 'gemini-2.5-flash-lite'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const MAX_RETRIES = 2
const MAX_RETRY_WAIT_MS = 8000

const MODEL_FALLBACKS = [
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
] as const

const LOCALE_NAMES: Record<ContentLocale, string> = {
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic',
}

function getConfiguredModel(): string | null {
  const configured = process.env.GEMINI_TRANSLATE_MODEL?.trim()
  return configured || null
}

function getModelCandidates(): string[] {
  const configured = getConfiguredModel()
  const ordered = configured
    ? [configured, ...MODEL_FALLBACKS.filter((m) => m !== configured)]
    : [...MODEL_FALLBACKS]
  return [...new Set(ordered)]
}

function parseRetryDelayMs(body: string): number | null {
  const match = body.match(/retry in ([\d.]+)s/i)
  if (!match) return null
  const seconds = Number.parseFloat(match[1])
  if (!Number.isFinite(seconds)) return null
  return Math.min(Math.ceil(seconds * 1000), MAX_RETRY_WAIT_MS)
}

function normalizeLocaleArray(value: unknown, expectedLength: number): string[] {
  if (Array.isArray(value)) {
    if (value.length === expectedLength) {
      return value.map((item) => String(item ?? '').trim())
    }
    if (value.length === 1 && expectedLength === 1) {
      return [String(value[0] ?? '').trim()]
    }
  }
  if (typeof value === 'string' && expectedLength === 1) {
    return [value.trim()]
  }
  throw new Error('Invalid translation array shape')
}

function parseTranslationJson(
  raw: string,
  targetLocales: ContentLocale[],
  expectedLength: number
): TranslateTextsResult {
  const trimmed = raw.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Gemini response did not contain JSON object')
  }
  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
  const result: TranslateTextsResult = {}
  for (const locale of targetLocales) {
    result[locale] = normalizeLocaleArray(parsed[locale], expectedLength)
  }
  return result
}

function extractGeminiText(data: {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
}): string {
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) {
    throw new Error('Gemini returned empty translation')
  }
  return content
}

function buildGeminiError(status: number, body: string): Error {
  if (status === 429) {
    const retryMs = parseRetryDelayMs(body)
    if (retryMs) {
      return new Error(
        `Gemini API quota exceeded. Wait ${Math.ceil(retryMs / 1000)}s or use gemini-2.5-flash-lite in GEMINI_TRANSLATE_MODEL.`
      )
    }
    return new Error(
      'Gemini API quota exceeded. Try gemini-2.5-flash-lite or wait a minute before editing again.'
    )
  }
  if (status === 404) {
    return new Error('Gemini model not found. Set GEMINI_TRANSLATE_MODEL=gemini-2.5-flash-lite in .env')
  }
  return new Error(`Gemini request failed (${status})`)
}

async function callGeminiModel(
  model: string,
  apiKey: string,
  systemInstruction: string,
  userPayload: string
): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPayload }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  })

  const body = await response.text()
  if (!response.ok) {
    return { ok: false, status: response.status, body }
  }

  const data = JSON.parse(body) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }
  return { ok: true, text: extractGeminiText(data) }
}

export function isGeminiTranslateConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export async function translateTexts(
  input: TranslateTextsInput
): Promise<TranslateTextsResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const { texts, sourceLocale, targetLocales, textKind = 'listing' } = input
  if (texts.length === 0) {
    return Object.fromEntries(targetLocales.map((l) => [l, []])) as TranslateTextsResult
  }

  const filteredTargets = targetLocales.filter((l) => l !== sourceLocale)
  if (filteredTargets.length === 0) {
    return {}
  }

  const models = getModelCandidates()
  const startedAt = Date.now()
  const totalChars = texts.reduce((sum, t) => sum + t.length, 0)
  log.info('translateTexts start', {
    at: new Date(startedAt).toISOString(),
    sourceLocale,
    targetLocales: filteredTargets,
    textCount: texts.length,
    totalChars,
    models,
  })

  const targetSpec = filteredTargets
    .map((l) => `"${l}": array of exactly ${texts.length} ${LOCALE_NAMES[l]} strings`)
    .join(', ')

  const tagHint =
    textKind === 'tag'
      ? 'Each input is a short property feature or amenity label (a few words). Keep translations concise, suitable for UI tags.'
      : 'Preserve line breaks and list formatting for longer listing text.'

  const systemInstruction = `You are a professional real estate copy translator for luxury properties in Dubai, UAE.
Translate each input string from ${LOCALE_NAMES[sourceLocale]} into the requested languages.
${tagHint}
Use natural, marketing-appropriate tone.
For Arabic (ar), output proper Modern Standard Arabic suitable for RTL display.
Respond with JSON only, no markdown. Required shape: { ${targetSpec} }
The arrays must have exactly ${texts.length} item(s), in the same order as the input texts.`

  const userPayload = JSON.stringify({ sourceLocale, texts })

  let lastError: Error | null = null

  for (const model of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const result = await callGeminiModel(model, apiKey, systemInstruction, userPayload)

      if (result.ok) {
        try {
          const translations = parseTranslationJson(result.text, filteredTargets, texts.length)
          log.info('translateTexts done', {
            at: new Date().toISOString(),
            elapsedMs: Date.now() - startedAt,
            model,
            attempt,
            sourceLocale,
            targetLocales: filteredTargets,
            textCount: texts.length,
          })
          return translations
        } catch (parseError) {
          lastError =
            parseError instanceof Error ? parseError : new Error('Invalid Gemini JSON response')
          log.error('translateTexts parse error', {
            at: new Date().toISOString(),
            model,
            message: lastError.message,
          })
          break
        }
      }

      const err = buildGeminiError(result.status, result.body)
      lastError = err
      log.error('translateTexts Gemini error', {
        at: new Date().toISOString(),
        model,
        attempt,
        status: result.status,
        bodyPreview: result.body.slice(0, 200),
      })

      if (result.status === 429 && attempt < MAX_RETRIES) {
        const waitMs = parseRetryDelayMs(result.body) ?? 2000
        await new Promise((resolve) => setTimeout(resolve, waitMs))
        continue
      }

      if (result.status === 429 || result.status === 404) {
        break
      }
    }
  }

  throw lastError ?? new Error('Translation failed')
}
