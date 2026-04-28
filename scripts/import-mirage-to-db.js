const { createPrisma } = require('./_prisma');
const fs = require('fs');
const path = require('path');

const prisma = createPrisma();

async function waitForDatabase(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✓ База данных доступна');
      return true;
    } catch {
      if (i === 0) {
        console.log('⏳ Ожидание доступности базы данных...');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}

async function importMirage() {
  try {
    // Ждем доступности базы данных
    const dbAvailable = await waitForDatabase();
    if (!dbAvailable) {
      console.error('❌ База данных недоступна. Убедитесь, что PostgreSQL запущен.');
      process.exit(1);
    }

    // Загружаем метаданные
    const metadataPath = path.join(__dirname, '..', 'mirage-import-metadata.json');
    if (!fs.existsSync(metadataPath)) {
      console.error('❌ Файл метаданных не найден. Сначала запустите import-mirage-standalone.js');
      process.exit(1);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    console.log('\n📦 Начинаем импорт в базу данных...\n');

    // Найти или создать район
    const districtSlug = 'the-oasis';
    let area = await prisma.area.findFirst({
      where: {
        OR: [
          { name: { contains: metadata.district, mode: 'insensitive' } },
          { nameEn: { contains: metadata.district, mode: 'insensitive' } },
          { slug: districtSlug },
        ],
      },
    });

    if (!area) {
      area = await prisma.area.create({
        data: {
          name: metadata.district,
          nameEn: metadata.district,
          city: 'Dubai',
          slug: districtSlug,
        },
      });
      console.log(`✓ Создан район: ${metadata.district}`);
    } else {
      console.log(`✓ Найден район: ${metadata.district}`);
    }

    // Генерируем slug
    const baseSlug = 'the-oasis-mirage';
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.property.findUnique({
        where: { slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Создаем объект недвижимости
    const property = await prisma.property.create({
      data: {
        title: metadata.propertyName,
        description: `Discover ${metadata.propertyName}, an exceptional luxury property in ${metadata.district}. This premium real estate opportunity offers world-class amenities, stunning architecture, and prime location. Perfect for investors seeking high returns and lifestyle excellence in the heart of Dubai.`,
        price: 1000000,
        currency: 'AED',
        type: 'APARTMENT',
        areaSqm: 100,
        bedrooms: 2,
        bathrooms: 2,
        parking: 1,
        address: `${metadata.propertyName}, ${metadata.district}, Dubai`,
        city: 'Dubai',
        district: metadata.district,
        areaId: area.id,
        slug: slug,
        metaTitle: `${metadata.propertyName} in ${metadata.district} - Luxury Real Estate | SGIP Real Estate`,
        metaDescription: `Explore ${metadata.propertyName} in ${metadata.district}. Premium luxury property with exceptional amenities. Investment opportunity in Dubai's most prestigious location.`,
        features: [],
        amenities: [],
        isPublished: true,
        isFeatured: false,
      },
    });

    console.log(`✓ Создана недвижимость: ${metadata.propertyName} (ID: ${property.id})`);

    // Добавляем изображения
    if (metadata.images.length > 0) {
      await prisma.propertyImage.createMany({
        data: metadata.images.map(img => ({
          propertyId: property.id,
          url: img.url,
          alt: img.alt || '',
          order: img.order,
          isMain: img.isMain,
        })),
      });
      console.log(`✓ Добавлено изображений: ${metadata.images.length}`);
    }

    // Добавляем видео (как изображения для галереи)
    if (metadata.videos.length > 0) {
      await prisma.propertyImage.createMany({
        data: metadata.videos.map(video => ({
          propertyId: property.id,
          url: video.url,
          alt: video.title,
          order: metadata.images.length + video.order,
          isMain: false,
        })),
      });
      console.log(`✓ Добавлено видео: ${metadata.videos.length}`);
    }

    // Добавляем документы
    if (metadata.files.length > 0) {
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };

      await prisma.propertyFile.createMany({
        data: metadata.files.map(file => ({
          propertyId: property.id,
          url: file.url,
          label: file.label,
          filename: file.filename,
          size: file.size,
          mimeType: mimeTypes[path.extname(file.filename).toLowerCase()] || 'application/octet-stream',
          order: file.order,
        })),
      });
      console.log(`✓ Добавлено документов: ${metadata.files.length}`);
    }

    console.log(`\n✅ Импорт завершен успешно!`);
    console.log(`   Недвижимость доступна по адресу: http://localhost:4000/properties/${slug}`);
    console.log(`   Админ-панель: http://localhost:4000/admin`);

  } catch (error) {
    console.error('❌ Ошибка при импорте:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importMirage().catch(console.error);
