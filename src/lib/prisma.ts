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
