import crypto from 'crypto'
import type { NextApiRequest } from 'next'
import type { AdminRole } from '../../prisma/generated/client'
import { prisma } from '@/lib/prisma'
import { createScopedLogger } from '@/lib/logger'

export type { AdminRole }

export type AdminSessionPayload = {
  adminId: string | null
  role: AdminRole
  email: string | null
  isEnvBootstrap: boolean
}

export type AdminAuthSuccess =
  | { ok: true; envBootstrap: true }
  | {
      ok: true
      envBootstrap: false
      admin: { id: string; email: string; role: AdminRole; name: string | null }
    }

export type AdminAuthResult = AdminAuthSuccess | { ok: false }

export const ADMIN_SESSION_COOKIE = 'sgip_admin_session'
const MAX_AGE_SEC = 60 * 60 * 24 * 7

/**
 * Set `Secure` on admin cookies only when the request is actually HTTPS (TLS or
 * `x-forwarded-proto`). Using `NODE_ENV === 'production'` alone breaks `next start`
 * on http://localhost — the browser drops the cookie and login appears broken.
 */
export function shouldUseSecureAdminSessionCookie(req: NextApiRequest): boolean {
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

type SessionTokenBody = {
  exp: number
  adminId?: string
  role?: AdminRole
  email?: string
  envBootstrap?: boolean
}

function signSessionPayload(body: SessionTokenBody): string | null {
  const secret = sessionSecret()
  if (!secret) return null
  const payload = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function createAdminSessionToken(session: {
  adminId?: string | null
  role: AdminRole
  email?: string | null
  envBootstrap?: boolean
}): string | null {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  return signSessionPayload({
    exp,
    adminId: session.adminId ?? undefined,
    role: session.role,
    email: session.email ?? undefined,
    envBootstrap: session.envBootstrap ?? false,
  })
}

function parseVerifiedSessionToken(token: string | undefined): SessionTokenBody | null {
  if (!token) return null
  const secret = sessionSecret()
  if (!secret) return null
  const dot = token.indexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!payload || !sig) return null
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  const sigBuf = Buffer.from(sig, 'utf8')
  const expBuf = Buffer.from(expected, 'utf8')
  if (sigBuf.length !== expBuf.length) return null
  try {
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionTokenBody
    if (typeof parsed.exp !== 'number' || parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  return parseVerifiedSessionToken(token) !== null
}

export function getAdminSessionFromRequest(req: NextApiRequest): AdminSessionPayload | null {
  const token = readCookie(req, ADMIN_SESSION_COOKIE)
  const parsed = parseVerifiedSessionToken(token)
  if (!parsed) return null

  if (parsed.envBootstrap || (!parsed.adminId && !parsed.role)) {
    return {
      adminId: null,
      role: 'SUPER_ADMIN',
      email: parsed.email ?? null,
      isEnvBootstrap: true,
    }
  }

  return {
    adminId: parsed.adminId ?? null,
    role: parsed.role ?? 'SUPER_ADMIN',
    email: parsed.email ?? null,
    isEnvBootstrap: Boolean(parsed.envBootstrap),
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

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<AdminAuthResult> {
  if (verifyEnvAdminCredentials(username, password)) {
    return { ok: true, envBootstrap: true }
  }

  const normalizedUsername = username.trim().toLowerCase()
  if (!normalizedUsername || !password) {
    return { ok: false }
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { email: normalizedUsername },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        passwordSetAt: true,
      },
    })

    if (!admin) {
      return { ok: false }
    }

    if (!admin.isActive) {
      return { ok: false }
    }

    if (!admin.passwordSetAt) {
      return { ok: false }
    }

    let passwordValid = verifyPasswordHash(password, admin.password)

    if (!passwordValid) {
      const legacyMatch =
        admin.password.length === password.length &&
        crypto.timingSafeEqual(Buffer.from(admin.password, 'utf8'), Buffer.from(password, 'utf8'))

      if (!legacyMatch) {
        return { ok: false }
      }

      await prisma.admin.update({
        where: { id: admin.id },
        data: { password: hashAdminPassword(password) },
      })
      passwordValid = true
    }

    if (!passwordValid) {
      return { ok: false }
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    })

    return {
      ok: true,
      envBootstrap: false,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    }
  } catch (error) {
    log.errorWithException('Admin DB auth error', error, { username: normalizedUsername })
    return { ok: false }
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

/** True when the request carries a valid HttpOnly admin session cookie (mutating API routes). */
export function isAdminSessionValid(req: NextApiRequest): boolean {
  return getAdminSessionFromRequest(req) !== null
}
