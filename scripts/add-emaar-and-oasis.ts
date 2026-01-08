/**
 * Script to add Emaar developer and The Oasis area to the database
 * Run with: npx ts-node scripts/add-emaar-and-oasis.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Generate URL-friendly slug from string
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

async function main() {
  console.log('Adding Emaar developer and The Oasis area...')

  // Add Emaar developer
  const emaarSlug = generateSlug('Emaar')
  const existingEmaar = await prisma.developer.findUnique({
    where: { slug: emaarSlug },
  })

  if (existingEmaar) {
    console.log(`✅ Emaar developer already exists (slug: ${emaarSlug})`)
  } else {
    const emaar = await prisma.developer.create({
      data: {
        name: 'Emaar',
        nameEn: 'Emaar',
        slug: emaarSlug,
        city: 'Dubai',
        description: 'Emaar Properties is one of the world\'s leading real estate developers, known for creating iconic landmarks and master-planned communities.',
        descriptionEn: 'Emaar Properties is one of the world\'s leading real estate developers, known for creating iconic landmarks and master-planned communities.',
        website: 'https://www.emaar.com',
      },
    })
    console.log(`✅ Created Emaar developer (id: ${emaar.id}, slug: ${emaar.slug})`)
  }

  // Add The Oasis area
  const oasisSlug = generateSlug('The Oasis')
  const existingOasis = await prisma.area.findUnique({
    where: { slug: oasisSlug },
  })

  if (existingOasis) {
    console.log(`✅ The Oasis area already exists (slug: ${oasisSlug})`)
  } else {
    const oasis = await prisma.area.create({
      data: {
        name: 'The Oasis',
        nameEn: 'The Oasis',
        slug: oasisSlug,
        city: 'Dubai',
        description: 'The Oasis is a prestigious residential community in Dubai offering luxury living with world-class amenities.',
        descriptionEn: 'The Oasis is a prestigious residential community in Dubai offering luxury living with world-class amenities.',
      },
    })
    console.log(`✅ Created The Oasis area (id: ${oasis.id}, slug: ${oasis.slug})`)
  }

  console.log('\n✅ Done! Both Emaar developer and The Oasis area are now available in the admin panel.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

