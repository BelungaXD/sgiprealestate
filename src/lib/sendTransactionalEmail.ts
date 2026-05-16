import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('lib/sendTransactionalEmail')

export type SendEmailResult =
  | { ok: true; provider: 'resend' }
  | { ok: false; reason: 'not_configured' | 'send_failed'; message?: string }

export async function sendAdminInviteEmail(params: {
  to: string
  inviteUrl: string
  roleLabel: string
}): Promise<SendEmailResult> {
  const { getIntegrationSecret } = await import('@/lib/integrations/secrets')
  const apiKey = (await getIntegrationSecret('resend_api_key')) || ''
  const from = (await getIntegrationSecret('email_from')) || ''
  if (!apiKey || !from) {
    return { ok: false, reason: 'not_configured' }
  }

  const subject = 'SGIP Admin — set up your account'
  const html = `
    <p>You have been invited to the SGIP Real Estate admin panel as <strong>${escapeHtml(params.roleLabel)}</strong>.</p>
    <p><a href="${escapeHtml(params.inviteUrl)}">Click here to choose your password</a> (link expires in a few days).</p>
    <p>If the button does not work, copy this URL into your browser:</p>
    <p style="word-break:break-all;">${escapeHtml(params.inviteUrl)}</p>
    <p>If you did not expect this email, you can ignore it.</p>
  `.trim()

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      log.warn('Resend API error', { status: res.status, body: body.slice(0, 500) })
      return { ok: false, reason: 'send_failed', message: body.slice(0, 200) }
    }
    return { ok: true, provider: 'resend' }
  } catch (error) {
    log.errorWithException('Failed to send invite email', error)
    return { ok: false, reason: 'send_failed' }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
