// Dynamic import to avoid errors when Prisma Client is not generated
let PrismaClient: any = null
let prismaModule: any = null

try {
  prismaModule = require('@prisma/client')
  PrismaClient = prismaModule.PrismaClient
} catch (error: any) {
  // Prisma Client not generated - this is OK, we'll handle it gracefully
  if (error.message?.includes('did not initialize') || error.code === 'MODULE_NOT_FOUND') {
    console.warn('Prisma Client not found. Please run "npm run db:generate"')
  } else {
    console.error('Error loading Prisma Client:', error)
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

// Initialize Prisma Client only if available and DATABASE_URL is configured
let prismaInstance: any = null

function initializePrisma(): any {
  // If Prisma Client is not available, return null
  if (!PrismaClient) {
    return null
  }

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    return null
  }

  // If already initialized, return it
  if (prismaInstance) {
    return prismaInstance
  }

  try {
    // Fix DATABASE_URL if it has quotes or encoding issues
    let databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error('DATABASE_URL is not set in environment variables')
      return null
    }
    // Remove surrounding quotes if present
    if ((databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) ||
        (databaseUrl.startsWith("'") && databaseUrl.endsWith("'"))) {
      databaseUrl = databaseUrl.slice(1, -1)
    }
    
    console.log('[Prisma] Initializing with DATABASE_URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'))
    
    // Ensure proper URL encoding for special characters in password
    // If the URL doesn't have proper encoding, try to fix it
    if (databaseUrl.includes('://') && !databaseUrl.includes('%')) {
      // Check if password contains special characters that need encoding
      const urlMatch = databaseUrl.match(/^([^:]+):\/\/([^:]+):([^@]+)@(.+)$/)
      if (urlMatch) {
        const [, protocol, user, password, rest] = urlMatch
        // Only re-encode if password contains unencoded special chars
        if (password.includes('/') || password.includes('+') || password.includes('=')) {
          const encodedPassword = encodeURIComponent(password)
          databaseUrl = `${protocol}://${user}:${encodedPassword}@${rest}`
        }
      }
    }

    // Set the corrected DATABASE_URL
    process.env.DATABASE_URL = databaseUrl

    prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance
    }

    return prismaInstance
  } catch (error: any) {
    console.error('Failed to initialize Prisma Client:', error)
    return null
  }
}

// Export prisma with lazy initialization
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    // Special handling for $connect - return a no-op function if DB not available
    if (prop === '$connect') {
      return async () => {
        const client = initializePrisma()
        if (!client) {
          // Throw error that will be caught and handled as demo mode
          throw new Error('Database is not configured')
        }
        return client.$connect()
      }
    }
    
    // Special handling for $disconnect
    if (prop === '$disconnect') {
      return async () => {
        const client = initializePrisma()
        if (client) {
          return client.$disconnect()
        }
      }
    }
    
    const client = initializePrisma()
    if (!client) {
      // Return a mock that throws helpful errors when called
      if (typeof prop === 'string') {
        return (...args: any[]) => {
          throw new Error(`Database is not configured. Please set DATABASE_URL in your .env file and run "npm run db:generate". Attempted to call: ${prop}`)
        }
      }
      return undefined
    }
    const value = client[prop]
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

