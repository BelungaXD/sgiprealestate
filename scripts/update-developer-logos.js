const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateDeveloperLogos() {
  try {
    console.log('Updating developer logos...')

    // Обновляем логотип для Sobha
    const sobha = await prisma.developer.updateMany({
      where: {
        OR: [
          { name: { contains: 'Sobha', mode: 'insensitive' } },
          { nameEn: { contains: 'Sobha', mode: 'insensitive' } },
          { slug: { contains: 'sobha', mode: 'insensitive' } },
        ],
      },
      data: {
        logo: '/uploads/developers/sobha_logo.png',
      },
    })

    console.log(`Updated ${sobha.count} Sobha developer(s)`)

    // Обновляем логотип для Emaar
    const emaar = await prisma.developer.updateMany({
      where: {
        OR: [
          { name: { contains: 'Emaar', mode: 'insensitive' } },
          { nameEn: { contains: 'Emaar', mode: 'insensitive' } },
          { slug: { contains: 'emaar', mode: 'insensitive' } },
        ],
      },
      data: {
        logo: '/uploads/developers/emaar_logo.png',
      },
    })

    console.log(`Updated ${emaar.count} Emaar developer(s)`)

    // Показываем все застройщики с их логотипами
    const allDevelopers = await prisma.developer.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        logo: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    console.log('\nAll developers:')
    allDevelopers.forEach((dev) => {
      console.log(`- ${dev.name} (${dev.nameEn || 'N/A'}) [${dev.slug}]: ${dev.logo || 'No logo'}`)
    })

    console.log('\n✅ Logo update completed!')
  } catch (error) {
    console.error('Error updating developer logos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateDeveloperLogos()

