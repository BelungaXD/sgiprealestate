import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { requireAdminSession } from '@/lib/adminAuth'
import { INTEGRATION_DEFINITION_BY_KEY } from '@/lib/integrations/catalog'
import { listIntegrationsForAdmin, saveIntegrationSecrets } from '@/lib/integrations/secrets'
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('api/admin/integrations')

const updateSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1).max(80),
      value: z.string().max(8000),
    })
  ),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res, { permission: 'system_settings' })
  if (!session) return

  if (req.method === 'GET') {
    try {
      const integrations = await listIntegrationsForAdmin()
      return res.status(200).json({ ok: true, integrations })
    } catch (error) {
      log.errorWithException('Failed to list integrations', error)
      return res.status(500).json({ ok: false, error: 'failed_to_load_integrations' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const parsed = updateSchema.parse(body)

      for (const item of parsed.settings) {
        if (!INTEGRATION_DEFINITION_BY_KEY.has(item.key)) {
          return res.status(400).json({ ok: false, error: 'unknown_integration_key', key: item.key })
        }
      }

      await saveIntegrationSecrets(parsed.settings)
      const integrations = await listIntegrationsForAdmin()
      return res.status(200).json({ ok: true, integrations })
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, error: 'invalid_payload', issues: error.issues })
      }
      log.errorWithException('Failed to save integrations', error)
      return res.status(500).json({ ok: false, error: 'failed_to_save_integrations' })
    }
  }

  return res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
