import { prisma } from '@/lib/prisma'
import { createScopedLogger } from '@/lib/logger'
import {
  INTEGRATION_DEFINITION_BY_KEY,
  INTEGRATION_DEFINITIONS,
  type IntegrationDefinition,
} from '@/lib/integrations/catalog'
import {
  decryptIntegrationValue,
  encryptIntegrationValue,
  maskSecret,
} from '@/lib/integrations/crypto'

const log = createScopedLogger('lib/integrations/secrets')

export type IntegrationSource = 'database' | 'env' | 'none'

export async function getIntegrationSecret(key: string): Promise<string | null> {
  const def = INTEGRATION_DEFINITION_BY_KEY.get(key)
  if (!def) return null

  try {
    const row = await prisma.integrationSetting.findUnique({ where: { key } })
    if (row?.valueEnc) {
      const decrypted = decryptIntegrationValue(row.valueEnc)
      if (decrypted?.trim()) return decrypted.trim()
    }
  } catch (error) {
    log.errorWithException('Failed to read integration from database', error, { key })
  }

  const fromEnv = process.env[def.envVar]?.trim()
  return fromEnv || null
}

function readEnvValue(def: IntegrationDefinition): string | null {
  const v = process.env[def.envVar]?.trim()
  return v || null
}

export async function listIntegrationsForAdmin() {
  const rows = await prisma.integrationSetting.findMany()
  const byKey = new Map(rows.map((r) => [r.key, r]))

  return INTEGRATION_DEFINITIONS.map((def) => {
    const row = byKey.get(def.key)
    let source: IntegrationSource = 'none'
    let masked = ''
    let hasValue = false

    if (row?.valueEnc) {
      const decrypted = decryptIntegrationValue(row.valueEnc)
      if (decrypted?.trim()) {
        source = 'database'
        hasValue = true
        masked = def.fieldType === 'secret' ? maskSecret(decrypted) : decrypted
      }
    }

    if (!hasValue) {
      const envVal = readEnvValue(def)
      if (envVal) {
        source = 'env'
        hasValue = true
        masked = def.fieldType === 'secret' ? maskSecret(envVal) : envVal
      }
    }

    return {
      key: def.key,
      envVar: def.envVar,
      category: def.category,
      labelKey: def.labelKey,
      descriptionKey: def.descriptionKey,
      fieldType: def.fieldType,
      optional: def.optional ?? false,
      configured: hasValue,
      source,
      maskedValue: masked,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    }
  })
}

export async function saveIntegrationSecrets(
  updates: Array<{ key: string; value: string }>
): Promise<void> {
  for (const { key, value } of updates) {
    const def = INTEGRATION_DEFINITION_BY_KEY.get(key)
    if (!def) continue

    const trimmed = value.trim()
    if (!trimmed) {
      await prisma.integrationSetting.deleteMany({ where: { key } }).catch(() => undefined)
      continue
    }

    const valueEnc = encryptIntegrationValue(trimmed)
    await prisma.integrationSetting.upsert({
      where: { key },
      create: { key, valueEnc },
      update: { valueEnc },
    })
  }
}
