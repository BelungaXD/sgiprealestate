import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

const limiter = new Map<string, { count: number; ts: number }>()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Optional captcha verification (Cloudflare Turnstile)
  const token = req.headers['cf-turnstile-token'] || req.body?.turnstileToken
  if (process.env.TURNSTILE_SECRET_KEY && token) {
    try {
      const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${token}`,
      }).then(r => r.json())
      if (!verify.success) return res.status(400).json({ error: 'Captcha failed' })
    } catch {}
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'ip'
  const now = Date.now()
  const rec = limiter.get(ip) || { count: 0, ts: now }
  if (now - rec.ts > 60_000) {
    rec.count = 0
    rec.ts = now
  }
  rec.count += 1
  limiter.set(ip, rec)
  if (rec.count > 10) return res.status(429).json({ error: 'Too many requests' })

  const { name, email, message } = req.body || {}
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' })

  const host = process.env.SMTP_HOST || 'localhost'
  const port = Number(process.env.SMTP_PORT || 1025)
  const user = process.env.SMTP_USER || ''
  const pass = process.env.SMTP_PASSWORD || ''

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: user ? { user, pass } : undefined,
  })

  try {
    await transporter.sendMail({
      from: 'no-reply@sgiprealestate.com',
      to: process.env.ADMIN_EMAIL || 'admin@sgiprealestate.com',
      subject: `New inquiry from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    })
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'Email failed' })
  }
}


