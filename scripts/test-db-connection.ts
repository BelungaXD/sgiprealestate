import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function test() {
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    const count = await prisma.developer.count()
    console.log(`✅ Developers count: ${count}`)
    
    const areasCount = await prisma.area.count()
    console.log(`✅ Areas count: ${areasCount}`)
  } catch (e: any) {
    console.error('❌ Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}
test()
