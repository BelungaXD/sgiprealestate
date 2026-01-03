const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateDeveloperDescriptions() {
  try {
    console.log('Updating developer descriptions...')

    // Обновляем описание для Emaar Properties
    const emaar = await prisma.developer.updateMany({
      where: {
        OR: [
          { name: { contains: 'Emaar', mode: 'insensitive' } },
          { nameEn: { contains: 'Emaar', mode: 'insensitive' } },
          { slug: { contains: 'emaar', mode: 'insensitive' } },
        ],
      },
      data: {
        description: 'Emaar Properties - ведущий застройщик недвижимости в Дубае, известный своими премиальными проектами мирового класса. Компания создала одни из самых знаковых объектов недвижимости в регионе, включая Burj Khalifa, Dubai Mall и Dubai Marina.',
        descriptionEn: 'Emaar Properties is a leading real estate developer in Dubai, renowned for its world-class premium projects. The company has created some of the most iconic real estate developments in the region, including Burj Khalifa, Dubai Mall, and Dubai Marina.',
        website: 'https://www.emaar.com',
      },
    })

    console.log(`Updated ${emaar.count} Emaar developer(s)`)

    // Обновляем описание для Sobha
    const sobha = await prisma.developer.updateMany({
      where: {
        OR: [
          { name: { contains: 'Sobha', mode: 'insensitive' } },
          { nameEn: { contains: 'Sobha', mode: 'insensitive' } },
          { slug: { contains: 'sobha', mode: 'insensitive' } },
        ],
      },
      data: {
        description: 'Sobha Realty - премиальный застройщик недвижимости, специализирующийся на создании роскошных жилых и коммерческих проектов. Компания известна своим вниманием к деталям и высоким качеством строительства.',
        descriptionEn: 'Sobha Realty is a premium real estate developer specializing in creating luxurious residential and commercial projects. The company is known for its attention to detail and high-quality construction.',
        website: 'https://www.sobharealty.com',
      },
    })

    console.log(`Updated ${sobha.count} Sobha developer(s)`)

    // Показываем все застройщики с их данными
    const allDevelopers = await prisma.developer.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        slug: true,
        logo: true,
        description: true,
        descriptionEn: true,
        website: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    console.log('\nAll developers:')
    allDevelopers.forEach((dev) => {
      console.log(`- ${dev.name} (${dev.nameEn || 'N/A'}) [${dev.slug}]`)
      console.log(`  Logo: ${dev.logo || 'No logo'}`)
      console.log(`  Website: ${dev.website || 'No website'}`)
      console.log(`  Description: ${dev.description ? dev.description.substring(0, 50) + '...' : 'No description'}`)
    })

    console.log('\n✅ Developer descriptions update completed!')
  } catch (error) {
    console.error('Error updating developer descriptions:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateDeveloperDescriptions()

