import crypto from 'crypto'

export const ADMIN_SESSION_COOKIE = 'sgip_admin_session'
const MAX_AGE_SEC = 60 * 60 * 24 * 7

function sessionSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 16) return fromEnv
  if (process.env.NODE_ENV !== 'production') {
    // Dev-only fallback so local admin works with only ADMIN_PASSWORD set
    return 'dev-sgip-admin-session-secret-min-32-chars'
  }
  return ''
}

export function adminSessionConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.length && sessionSecret())
}

export function createAdminSessionToken(): string | null {
  const secret = sessionSecret()
  if (!secret) return null
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  const payload = Buffer.from(JSON.stringify({ exp }), 'utf8').toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false
  const secret = sessionSecret()
  if (!secret) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!payload || !sig) return false
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  const sigBuf = Buffer.from(sig, 'utf8')
  const expBuf = Buffer.from(expected, 'utf8')
  if (sigBuf.length !== expBuf.length) return false
  try {
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false
  } catch {
    return false
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: number
    }
    return typeof parsed.exp === 'number' && parsed.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim()
  const expectedPass = process.env.ADMIN_PASSWORD || ''
  if (!expectedPass) return false
  const uOk =
    expectedUser.length === username.length &&
    crypto.timingSafeEqual(Buffer.from(username, 'utf8'), Buffer.from(expectedUser, 'utf8'))
  const pOk =
    expectedPass.length === password.length &&
    crypto.timingSafeEqual(Buffer.from(password, 'utf8'), Buffer.from(expectedPass, 'utf8'))
  return uOk && pOk
}
