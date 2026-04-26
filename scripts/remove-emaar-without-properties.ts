/**
 * Script to remove "Emaar" (without Properties) from database
 * Keeps only "Emaar Properties"
 * Run with: npx ts-node scripts/remove-emaar-without-properties.ts
 */

import { createPrisma } from './_prisma'
import { createScopedLogger } from '../src/lib/logger'

const prisma = createPrisma()
const log = createScopedLogger('scripts/remove-emaar-without-properties')

async function main() {
  log.info('Removing "Emaar" (without Properties) from database')

  // Find all developers with "Emaar" but not "Emaar Properties"
  const emaarWithoutProperties = await prisma.developer.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: 'Emaar', mode: 'insensitive' } },
            { nameEn: { contains: 'Emaar', mode: 'insensitive' } },
            { slug: { contains: 'emaar', mode: 'insensitive' } },
          ],
        },
        {
          NOT: [
            { name: { contains: 'Emaar Properties', mode: 'insensitive' } },
            { nameEn: { contains: 'Emaar Properties', mode: 'insensitive' } },
            { slug: { contains: 'emaar-properties', mode: 'insensitive' } },
          ],
        },
      ],
    },
  })

  if (emaarWithoutProperties.length === 0) {
    log.info('No "Emaar" (without Properties) found in database')
  } else {
    log.info('Found "Emaar" (without Properties) developers', {
      count: emaarWithoutProperties.length,
      developers: emaarWithoutProperties.map((dev) => ({
        name: dev.name,
        nameEn: dev.nameEn,
        slug: dev.slug,
        id: dev.id,
      })),
    })

    // Delete these developers
    const deleted = await prisma.developer.deleteMany({
      where: {
        id: {
          in: emaarWithoutProperties.map((d) => d.id),
        },
      },
    })

    log.info('Deleted "Emaar" (without Properties) developers', { deletedCount: deleted.count })
  }

  // Verify that only "Emaar Properties" exists
  const allEmaar = await prisma.developer.findMany({
    where: {
      OR: [
        { name: { contains: 'Emaar', mode: 'insensitive' } },
        { nameEn: { contains: 'Emaar', mode: 'insensitive' } },
        { slug: { contains: 'emaar', mode: 'insensitive' } },
      ],
    },
  })

  log.info('Remaining Emaar-related developers check')
  if (allEmaar.length === 0) {
    log.info('Remaining Emaar-related developers', { developers: [] })
  } else {
    log.info('Remaining Emaar-related developers', {
      developers: allEmaar.map((dev) => ({
        name: dev.name,
        nameEn: dev.nameEn,
        slug: dev.slug,
      })),
    })
  }

  log.info('Done')
}

main()
  .catch((e) => {
    log.errorWithException('remove-emaar-without-properties failed', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
