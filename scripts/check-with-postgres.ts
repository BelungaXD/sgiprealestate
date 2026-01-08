import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  try {
    const developers = await prisma.developer.findMany()
    console.log(`Developers: ${developers.length}`)
    developers.forEach(d => console.log(`  - ${d.name} (${d.slug})`))
    
    const areas = await prisma.area.findMany()
    console.log(`\nAreas: ${areas.length}`)
    areas.forEach(a => console.log(`  - ${a.name} (${a.slug})`))
  } catch (e: any) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}
check()
