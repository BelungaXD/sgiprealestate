import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  // Check if "Emaar" (without Properties) exists
  const existingEmaar = await prisma.developer.findFirst({
    where: {
      OR: [
        { name: 'Emaar' },
        { nameEn: 'Emaar' },
        { slug: 'emaar' }
      ]
    }
  })

  if (existingEmaar) {
    console.log('✅ Emaar already exists')
  } else {
    const emaar = await prisma.developer.create({
      data: {
        name: 'Emaar',
        nameEn: 'Emaar',
        slug: 'emaar',
        city: 'Dubai',
        description: 'Emaar Properties is one of the world\'s leading real estate developers.',
        descriptionEn: 'Emaar Properties is one of the world\'s leading real estate developers.',
        website: 'https://www.emaar.com',
      },
    })
    console.log(`✅ Created Emaar developer (id: ${emaar.id})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
