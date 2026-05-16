// Prisma 7 client with PostgreSQL driver adapter.
// Lazy-initialised so the app can boot in demo mode without DATABASE_URL.
import { createScopedLogger } from '@/lib/logger'

const log = createScopedLogger('lib/prisma')

type PrismaClientLike = {
  $connect: () => Promise<unknown>
  $disconnect: () => Promise<unknown>
  [key: string]: unknown
}
type PrismaClientCtorLike = new (options?: {
  adapter?: unknown
  log?: string[]
}) => PrismaClientLike
type PrismaPgCtorLike = new (options: {
  connectionString: string
}) => unknown
type ErrorLike = { code?: string }

let PrismaClientCtor: PrismaClientCtorLike | null = null
let PrismaPgCtor: PrismaPgCtorLike | null = null

try {
  PrismaClientCtor = require('../../prisma/generated/client').PrismaClient
} catch (error: unknown) {
  const err = (error || {}) as ErrorLike
  if (err.code === 'MODULE_NOT_FOUND') {
    log.warn('Prisma Client not generated. Run "npm run db:generate".')
  } else {
    log.errorWithException('Error loading Prisma Client', error)
  }
}

try {
  PrismaPgCtor = require('@prisma/adapter-pg').PrismaPg
} catch (error: unknown) {
  const err = (error || {}) as ErrorLike
  if (err.code === 'MODULE_NOT_FOUND') {
    log.warn('@prisma/adapter-pg not installed. Run "npm install".')
  } else {
    log.errorWithException('Error loading PrismaPg adapter', error)
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientLike | null }

let prismaInstance: PrismaClientLike | null = null

function normalizeDatabaseUrl(rawUrl: string): string {
  let url = rawUrl
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1)
  }
  // Re-encode password if it contains characters that break parsing and aren't already encoded.
  if (url.includes('://') && !url.includes('%')) {
    const match = url.match(/^([^:]+):\/\/([^:]+):([^@]+)@(.+)$/)
    if (match) {
      const [, protocol, user, password, rest] = match
      if (password.includes('/') || password.includes('+') || password.includes('=')) {
        url = `${protocol}://${user}:${encodeURIComponent(password)}@${rest}`
      }
    }
  }
  return url
}

function initializePrisma(): PrismaClientLike | null {
  if (!PrismaClientCtor || !PrismaPgCtor) return null
  if (!process.env.DATABASE_URL) return null
  if (prismaInstance) return prismaInstance

  try {
    const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)
    process.env.DATABASE_URL = databaseUrl

    if (process.env.NODE_ENV !== 'production') {
      log.info('Initializing Prisma with DATABASE_URL', {
        databaseUrl: databaseUrl.replace(/:[^:@]+@/, ':****@'),
      })
    }

    // #region agent log
    try {
      const parsed = new URL(databaseUrl)
      fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b58f84'},body:JSON.stringify({sessionId:'b58f84',hypothesisId:'H2',location:'lib/prisma.ts:initializePrisma',message:'prisma init target',data:{hostname:parsed.hostname,port:parsed.port||'5432',database:parsed.pathname.replace(/^\//,'')},timestamp:Date.now()})}).catch(()=>{});
    } catch {
      fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'b58f84'},body:JSON.stringify({sessionId:'b58f84',hypothesisId:'H2',location:'lib/prisma.ts:initializePrisma',message:'DATABASE_URL parse failed',data:{},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion

    const adapter = new PrismaPgCtor({ connectionString: databaseUrl })

    prismaInstance =
      globalForPrisma.prisma ??
      new PrismaClientCtor({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance
    }

    return prismaInstance
  } catch (error: unknown) {
    log.errorWithException('Failed to initialize Prisma Client', error)
    return null
  }
}

type ErrorWithCause = {
  code?: string
  message?: string
  cause?: unknown
  errors?: unknown[]
}

const collectErrorSignals = (error: unknown): { codes: Set<string>; messages: Set<string> } => {
  const codes = new Set<string>()
  const messages = new Set<string>()
  const queue: unknown[] = [error]
  const visited = new Set<unknown>()

  while (queue.length) {
    const current = queue.shift()
    if (!current || typeof current !== 'object' || visited.has(current)) continue
    visited.add(current)

    const err = current as ErrorWithCause
    if (typeof err.code === 'string' && err.code.trim()) codes.add(err.code)
    if (typeof err.message === 'string' && err.message.trim()) messages.add(err.message)
    if (err.cause) queue.push(err.cause)
    if (Array.isArray(err.errors)) queue.push(...err.errors)
  }

  return { codes, messages }
}

/** Prisma 7 + pg adapter may surface ECONNREFUSED instead of P1001. */
export function isDatabaseUnavailableError(error: unknown): boolean {
  const { codes, messages } = collectErrorSignals(error)
  const allMessages = Array.from(messages).join('\n')

  return (
    codes.has('P1001') ||
    codes.has('ECONNREFUSED') ||
    codes.has('ETIMEDOUT') ||
    codes.has('ENOTFOUND') ||
    allMessages.includes('DATABASE_URL') ||
    allMessages.includes("Can't reach database") ||
    allMessages.includes('Environment variable not found') ||
    allMessages.includes('ECONNREFUSED') ||
    allMessages.includes('did not initialize')
  )
}

export const DATABASE_UNAVAILABLE_MESSAGE =
  'Database server is not reachable. Start PostgreSQL locally, run database-server (Docker), or use an SSH tunnel to production.'

export const prisma = new Proxy({} as PrismaClientLike, {
  get(_target, prop) {
    if (prop === '$connect') {
      return async () => {
        const client = initializePrisma()
        if (!client) throw new Error('Database is not configured')
        return client.$connect()
      }
    }
    if (prop === '$disconnect') {
      return async () => {
        const client = initializePrisma()
        if (client) return client.$disconnect()
      }
    }

    const client = initializePrisma()
    if (!client) {
      if (typeof prop === 'string') {
        return () => {
          throw new Error(
            `Database is not configured. Set DATABASE_URL in .env and run "npm run db:generate". Attempted to call: ${prop}`
          )
        }
      }
      return undefined
    }
    const value = client[prop]
    if (typeof value === 'function') return value.bind(client)
    return value
  },
})
