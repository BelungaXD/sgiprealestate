import crypto from 'crypto'
import type { NextApiRequest } from 'next'
import { prisma } from '@/lib/prisma'
import { createScopedLogger } from '@/lib/logger'

export const ADMIN_SESSION_COOKIE = 'sgip_admin_session'
const MAX_AGE_SEC = 60 * 60 * 24 * 7

/**
 * Set `Secure` on admin cookies only when the request is actually HTTPS (TLS or
 * `x-forwarded-proto`). Using `NODE_ENV === 'production'` alone breaks `next start`
 * on http://localhost — the browser drops the cookie and login appears broken.
 */
export function useSecureAdminSessionCookie(req: NextApiRequest): boolean {
  const socket = req.socket as { encrypted?: boolean } | undefined
  if (socket?.encrypted) return true
  const forwarded = req.headers['x-forwarded-proto']
  const raw = Array.isArray(forwarded)
    ? forwarded[0]?.trim().toLowerCase()
    : typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim().toLowerCase()
      : undefined
  if (raw === 'https') return true
  if (raw === 'http') return false
  const host = (req.headers.host || '').split(':')[0].toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return false
  return process.env.NODE_ENV === 'production'
}
const PASSWORD_HASH_PREFIX = 'pbkdf2'
const PASSWORD_HASH_ITERATIONS = 120000
const PASSWORD_HASH_LENGTH = 64
const log = createScopedLogger('lib/adminSession')

/** Stable HMAC key when ADMIN_SESSION_SECRET is unset (avoids 503 if only ADMIN_PASSWORD is configured). */
function sessionSecretFromAdminPassword(): string {
  const pass = process.env.ADMIN_PASSWORD?.trim()
  if (!pass) return ''
  return crypto.createHash('sha256').update(`sgip-admin-session-v1:${pass}`, 'utf8').digest('hex')
}

function sessionSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 16) return fromEnv
  const derived = sessionSecretFromAdminPassword()
  if (derived) return derived
  if (process.env.NODE_ENV !== 'production') {
    // Dev-only fallback so local admin works with no admin env at all
    return 'dev-sgip-admin-session-secret-min-32-chars'
  }
  return ''
}

export function adminSessionConfigured(): boolean {
  return Boolean(sessionSecret())
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

function verifyEnvAdminCredentials(username: string, password: string): boolean {
  const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim()
  const expectedPass = (process.env.ADMIN_PASSWORD || '').trim()
  if (!expectedPass) return false
  const uOk =
    expectedUser.length === username.length &&
    crypto.timingSafeEqual(Buffer.from(username, 'utf8'), Buffer.from(expectedUser, 'utf8'))
  const pOk =
    expectedPass.length === password.length &&
    crypto.timingSafeEqual(Buffer.from(password, 'utf8'), Buffer.from(expectedPass, 'utf8'))
  return uOk && pOk
}

function pbkdf2Hash(password: string, salt: string, iterations: number): string {
  return crypto.pbkdf2Sync(password, salt, iterations, PASSWORD_HASH_LENGTH, 'sha512').toString('hex')
}

export function hashAdminPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = pbkdf2Hash(password, salt, PASSWORD_HASH_ITERATIONS)
  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_HASH_ITERATIONS}$${salt}$${hash}`
}

function verifyPasswordHash(plainPassword: string, storedPassword: string): boolean {
  const parts = storedPassword.split('$')
  if (parts.length !== 4 || parts[0] !== PASSWORD_HASH_PREFIX) {
    return false
  }

  const iterations = Number(parts[1])
  const salt = parts[2]
  const expectedHash = parts[3]

  if (!Number.isInteger(iterations) || iterations <= 0 || !salt || !expectedHash) {
    return false
  }

  const actualHash = pbkdf2Hash(plainPassword, salt, iterations)
  const actual = Buffer.from(actualHash, 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  if (actual.length !== expected.length) return false

  try {
    return crypto.timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  if (verifyEnvAdminCredentials(username, password)) {
    return true
  }

  const normalizedUsername = username.trim().toLowerCase()
  if (!normalizedUsername || !password) {
    return false
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { email: normalizedUsername },
      select: { id: true, password: true },
    })

    if (!admin) {
      return false
    }

    if (verifyPasswordHash(password, admin.password)) {
      return true
    }

    // Backward compatibility for legacy plain-text passwords.
    const legacyMatch =
      admin.password.length === password.length &&
      crypto.timingSafeEqual(Buffer.from(admin.password, 'utf8'), Buffer.from(password, 'utf8'))

    if (!legacyMatch) {
      return false
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashAdminPassword(password) },
    })

    return true
  } catch (error) {
    log.errorWithException('Admin DB auth error', error, { username: normalizedUsername })
    return false
  }
}

export function readCookie(req: NextApiRequest, name: string): string | undefined {
  const raw = req.headers.cookie
  if (!raw) return undefined
  const parts = raw.split(';')
  for (const p of parts) {
    const [k, ...rest] = p.trim().split('=')
    if (k === name && rest.length) {
      return decodeURIComponent(rest.join('='))
    }
  }
  return undefined
}
