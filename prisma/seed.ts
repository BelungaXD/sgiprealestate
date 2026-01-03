import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.property.deleteMany()
  await prisma.area.deleteMany()
  await prisma.developer.deleteMany()

  console.log('✨ Database cleared. No seed data to add.')
  console.log('   Add your own data through the admin panel or API.')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
