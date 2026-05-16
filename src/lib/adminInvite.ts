import crypto from 'crypto'

const DEFAULT_INVITE_HOURS = 168

export function inviteExpiryHours(): number {
  const raw = process.env.ADMIN_INVITE_EXPIRY_HOURS?.trim()
  const n = raw ? Number.parseInt(raw, 10) : DEFAULT_INVITE_HOURS
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_INVITE_HOURS
}

export function createInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashInviteToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex')
}

export function inviteExpiresAt(): Date {
  return new Date(Date.now() + inviteExpiryHours() * 60 * 60 * 1000)
}

export function adminInviteBaseUrl(): string {
  const fromEnv =
    process.env.ADMIN_INVITE_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    ''
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'http://localhost:4000'
}

export function buildAdminInviteUrl(token: string): string {
  return `${adminInviteBaseUrl()}/admin/accept-invite?token=${encodeURIComponent(token)}`
}

export function generateStrongPassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%&*-_+='
  const all = upper + lower + digits + symbols
  const pick = (chars: string) => chars[crypto.randomInt(0, chars.length)]
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)]
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () =>
    pick(all)
  )
  const combined = [...required, ...rest]
  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1)
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }
  return combined.join('')
}
