import { createPrisma } from './_prisma'
import { createScopedLogger } from '../src/lib/logger'
const prisma = createPrisma()
const log = createScopedLogger('scripts/check-with-postgres')

async function check() {
  try {
    const developers = await prisma.developer.findMany()
    log.info('Developers loaded', { count: developers.length, developers: developers.map(d => ({ name: d.name, slug: d.slug })) })
    
    const areas = await prisma.area.findMany()
    log.info('Areas loaded', { count: areas.length, areas: areas.map(a => ({ name: a.name, slug: a.slug })) })
  } catch (error: unknown) {
    log.errorWithException('Check with postgres failed', error)
  } finally {
    await prisma.$disconnect()
  }
}
check()
