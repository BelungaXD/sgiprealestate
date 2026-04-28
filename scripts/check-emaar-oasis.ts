import { createPrisma } from './_prisma'
import { createScopedLogger } from '../src/lib/logger'
const prisma = createPrisma()
const log = createScopedLogger('scripts/check-emaar-oasis')

async function check() {
  try {
    log.info('Checking developers')
    const allDevelopers = await prisma.developer.findMany()
    log.info('Developers total', { total: allDevelopers.length })
    const emaar = allDevelopers.filter(d => d.name?.includes('Emaar') || d.nameEn?.includes('Emaar'))
    log.info('Emaar check', { found: emaar.length > 0, sample: emaar.length > 0 ? emaar[0] : null })
    
    log.info('Checking areas')
    const allAreas = await prisma.area.findMany()
    log.info('Areas total', { total: allAreas.length })
    const oasis = allAreas.filter(a => a.name?.includes('Oasis') || a.nameEn?.includes('Oasis'))
    log.info('The Oasis check', { found: oasis.length > 0, sample: oasis.length > 0 ? oasis[0] : null })
  } catch (error: unknown) {
    log.errorWithException('Check Emaar/Oasis failed', error)
  } finally {
    await prisma.$disconnect()
  }
}
check()
