#!/usr/bin/env ts-node
// Database Check Script for SGIP Real Estate
// Checks database connectivity and verifies tables exist
// This script is used by setup-database.sh

let PrismaClient: any
try {
  PrismaClient = require('@prisma/client').PrismaClient
} catch (error) {
  console.error('❌ Prisma Client not found. Please run: npm run db:generate')
  process.exit(1)
}

const prisma = new PrismaClient({
  log: ['error'],
})

async function checkDatabase() {
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check if properties table exists by trying to query it
    try {
      const count = await prisma.property.count()
      console.log(`✅ Database tables exist (properties table accessible, count: ${count})`)
      await prisma.$disconnect()
      process.exit(0)
    } catch (error: any) {
      // If table doesn't exist, Prisma will throw an error
      if (error.message && (
        error.message.includes('does not exist') ||
        error.message.includes('relation') && error.message.includes('properties')
      )) {
        console.log('⚠️  Database tables do not exist')
        await prisma.$disconnect()
        process.exit(1)
      } else {
        throw error
      }
    }
  } catch (error: any) {
    console.error('❌ Database check failed:', error.message)
    try {
      await prisma.$disconnect()
    } catch {
      // Ignore disconnect errors
    }
    process.exit(1)
  }
}

checkDatabase()
