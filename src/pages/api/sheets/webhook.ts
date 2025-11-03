import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Google Sheets Webhook Integration
 * This endpoint forwards form submissions to Google Sheets via Apps Script webhook
 * Alternative to Tilda forms integration
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) {
    // If no webhook URL configured, return success but log warning
    console.warn('GOOGLE_SHEETS_WEBHOOK_URL not configured')
    return res.status(200).json({ ok: true, message: 'Webhook not configured' })
  }

  const { name, email, phone, message, propertyId, source, timestamp } = req.body || {}

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields: name, email' })
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone: phone || '',
        message: message || '',
        propertyId: propertyId || '',
        source: source || 'website',
        timestamp: timestamp || new Date().toISOString(),
        date: new Date().toLocaleDateString('en-US'),
        time: new Date().toLocaleTimeString('en-US'),
      }),
    })

    if (!response.ok) {
      throw new Error(`Google Sheets webhook failed: ${response.statusText}`)
    }

    return res.status(200).json({ ok: true, message: 'Data sent to Google Sheets' })
  } catch (error) {
    console.error('Google Sheets webhook error:', error)
    return res.status(500).json({ error: 'Failed to send data to Google Sheets' })
  }
}

