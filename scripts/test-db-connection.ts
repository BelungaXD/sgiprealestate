import { createPrisma } from './_prisma'
import { createScopedLogger } from '../src/lib/logger'

const prisma = createPrisma({
  log: ['query', 'error', 'warn'],
})
const log = createScopedLogger('scripts/test-db-connection')

async function test() {
  try {
    log.info('Testing database connection')
    await prisma.$connect()
    log.info('Connected to database')
    
    const count = await prisma.developer.count()
    log.info('Developers count', { count })
    
    const areasCount = await prisma.area.count()
    log.info('Areas count', { count: areasCount })
  } catch (e: any) {
    log.errorWithException('Database connection test failed', e)
  } finally {
    await prisma.$disconnect()
  }
}
test()
