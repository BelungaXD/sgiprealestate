const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourcePath = '/Users/danilstashok/Desktop/Projects/SGIP/SGIP data/EMAAR Properties/The Oasis/The Oasis - Mirage';
const destBase = path.join(__dirname, '..', 'public', 'uploads', 'properties');

// Создаем директории
const dirs = {
  images: path.join(destBase, 'images'),
  videos: path.join(destBase, 'videos'),
  files: path.join(destBase, 'files'),
  thumbnails: path.join(destBase, 'images', 'thumbnails')
};

Object.values(dirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Создана директория: ${dir}`);
  }
});

// Функция для копирования файлов
function copyFilesRecursive(sourceDir, category) {
  const files = [];
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(sourceDir, entry.name);
    
    if (entry.isDirectory()) {
      // Рекурсивно обрабатываем подпапки
      const subFiles = copyFilesRecursive(fullPath, category);
      files.push(...subFiles);
    } else if (entry.isFile() && !entry.name.startsWith('.') && entry.name !== '.DS_Store') {
      const ext = path.extname(entry.name).toLowerCase();
      const timestamp = Date.now();
      const sanitized = entry.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueName = `${timestamp}-${sanitized}`;
      
      let destDir = dirs.files;
      if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(ext)) {
        destDir = dirs.images;
      } else if (['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext)) {
        destDir = dirs.videos;
      }
      
      const destPath = path.join(destDir, uniqueName);
      fs.copyFileSync(fullPath, destPath);
      
      files.push({
        original: entry.name,
        saved: uniqueName,
        path: destPath.replace(path.join(__dirname, '..', 'public'), ''),
        category,
        size: fs.statSync(destPath).size
      });
      
      console.log(`✓ Скопирован: ${entry.name} -> ${uniqueName}`);
    }
  }
  
  return files;
}

// Импортируем файлы
console.log('\n🚀 Начинаем импорт файлов...\n');
const allFiles = copyFilesRecursive(sourcePath, 'property');

const images = allFiles.filter(f => f.category === 'images' || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(path.extname(f.original).toLowerCase()));
const videos = allFiles.filter(f => f.category === 'videos' || ['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(path.extname(f.original).toLowerCase()));
const documents = allFiles.filter(f => f.category === 'files' || ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'].includes(path.extname(f.original).toLowerCase()));

console.log(`\n✅ Импорт завершен!`);
console.log(`   Изображений: ${images.length}`);
console.log(`   Видео: ${videos.length}`);
console.log(`   Документов: ${documents.length}`);
console.log(`   Всего файлов: ${allFiles.length}`);

// Сохраняем метаданные для последующего импорта в БД
const metadata = {
  propertyName: 'The Oasis - Mirage',
  district: 'The Oasis',
  folderName: 'The Oasis - Mirage',
  images: images.map((img, idx) => ({
    url: img.path,
    alt: `The Oasis - Mirage - ${img.original}`,
    order: idx,
    isMain: idx === 0
  })),
  videos: videos.map((vid, idx) => ({
    url: vid.path,
    title: vid.original.replace(/\.[^/.]+$/, ''),
    order: idx
  })),
  files: documents.map((doc, idx) => ({
    url: doc.path,
    label: doc.original.replace(/\.[^/.]+$/, ''),
    filename: doc.saved,
    size: doc.size,
    order: idx
  })),
  importedAt: new Date().toISOString()
};

const metadataPath = path.join(__dirname, '..', 'mirage-import-metadata.json');
fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
console.log(`\n📄 Метаданные сохранены в: ${metadataPath}`);
console.log(`\n💡 Теперь можно импортировать в БД через API или админ-панель`);
