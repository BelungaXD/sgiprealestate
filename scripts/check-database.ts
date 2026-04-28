#!/usr/bin/env ts-node
// Database Check Script for SGIP Real Estate
// Checks database connectivity and verifies tables exist
// This script is used by setup-database.sh
import { createScopedLogger } from '../src/lib/logger'

let createPrisma: typeof import('./_prisma').createPrisma
const log = createScopedLogger('scripts/check-database')
try {
  createPrisma = require('./_prisma').createPrisma
} catch {
  log.error('Prisma Client not found. Please run: npm run db:generate')
  process.exit(1)
}

const prisma = createPrisma({ log: ['error'] })

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function checkDatabase() {
  try {
    // Test connection
    await prisma.$connect()
    log.info('Database connection successful')

    // Check if properties table exists by trying to query it
    try {
      const count = await prisma.property.count()
      log.info('Database tables exist', { propertiesCount: count })
      await prisma.$disconnect()
      process.exit(0)
    } catch (error: unknown) {
      const message = getErrorMessage(error)
      // If table doesn't exist, Prisma will throw an error
      if (message && (
        message.includes('does not exist') ||
        message.includes('relation') && message.includes('properties')
      )) {
        log.warn('Database tables do not exist')
        await prisma.$disconnect()
        process.exit(1)
      } else {
        throw error
      }
    }
  } catch (error: unknown) {
    log.errorWithException('Database check failed', error)
    try {
      await prisma.$disconnect()
    } catch {
      // Ignore disconnect errors
    }
    process.exit(1)
  }
}

checkDatabase()
