import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { name, email, phone, message, source } = req.body || {}
  if (!name || !email) return res.status(400).json({ error: 'Missing fields' })

  const amoUrl = process.env.AMOCRM_WEBHOOK_URL
  const amoKey = process.env.AMOCRM_API_KEY
  const bitrixHook = process.env.BITRIX_WEBHOOK_URL

  try {
    if (amoUrl && amoKey) {
      await fetch(amoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${amoKey}` },
        body: JSON.stringify({ name, email, phone, message, source: source || 'website' }),
      })
    } else if (bitrixHook) {
      await fetch(bitrixHook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, source: source || 'website' }),
      })
    }
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'CRM forward failed' })
  }
}


