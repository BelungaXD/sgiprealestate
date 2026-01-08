import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  try {
    console.log('Checking developers...')
    const allDevelopers = await prisma.developer.findMany()
    console.log(`Total developers: ${allDevelopers.length}`)
    const emaar = allDevelopers.filter(d => d.name?.includes('Emaar') || d.nameEn?.includes('Emaar'))
    console.log('Emaar:', emaar.length > 0 ? JSON.stringify(emaar[0], null, 2) : 'NOT FOUND')
    
    console.log('\nChecking areas...')
    const allAreas = await prisma.area.findMany()
    console.log(`Total areas: ${allAreas.length}`)
    const oasis = allAreas.filter(a => a.name?.includes('Oasis') || a.nameEn?.includes('Oasis'))
    console.log('The Oasis:', oasis.length > 0 ? JSON.stringify(oasis[0], null, 2) : 'NOT FOUND')
  } catch (e: any) {
    console.error('Error:', e.message)
    console.error('Stack:', e.stack)
  } finally {
    await prisma.$disconnect()
  }
}
check()
