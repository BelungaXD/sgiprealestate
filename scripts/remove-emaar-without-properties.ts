/**
 * Script to remove "Emaar" (without Properties) from database
 * Keeps only "Emaar Properties"
 * Run with: npx ts-node scripts/remove-emaar-without-properties.ts
 */

import { createPrisma } from './_prisma'

const prisma = createPrisma()

async function main() {
  console.log('Removing "Emaar" (without Properties) from database...')

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
    console.log('✅ No "Emaar" (without Properties) found in database')
  } else {
    console.log(`Found ${emaarWithoutProperties.length} "Emaar" (without Properties) developer(s):`)
    emaarWithoutProperties.forEach((dev) => {
      console.log(`  - ${dev.name} (${dev.nameEn || 'N/A'}) [${dev.slug}] (id: ${dev.id})`)
    })

    // Delete these developers
    const deleted = await prisma.developer.deleteMany({
      where: {
        id: {
          in: emaarWithoutProperties.map((d) => d.id),
        },
      },
    })

    console.log(`\n✅ Deleted ${deleted.count} "Emaar" (without Properties) developer(s)`)
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

  console.log('\nRemaining Emaar-related developers:')
  if (allEmaar.length === 0) {
    console.log('  None')
  } else {
    allEmaar.forEach((dev) => {
      console.log(`  - ${dev.name} (${dev.nameEn || 'N/A'}) [${dev.slug}]`)
    })
  }

  console.log('\n✅ Done!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
