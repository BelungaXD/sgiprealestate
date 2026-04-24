const { PrismaClient } = require('../prisma/generated/client')
const { PrismaPg } = require('@prisma/adapter-pg')

function createPrisma(options = {}) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter, ...options })
}

module.exports = { createPrisma }
