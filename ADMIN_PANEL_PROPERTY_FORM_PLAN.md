# План реализации админ-панели для добавления недвижимости

## Цель
Создать полнофункциональную админ-панель для добавления, редактирования и управления недвижимостью с формой, включающей все необходимые поля.

## Технические требования

### Необходимые поля формы:
1. **Основная информация:**
   - Название (title) - обязательное
   - Описание (description) - обязательное
   - Категория/Тип (type) - выбор из: APARTMENT, VILLA, TOWNHOUSE, PENTHOUSE, STUDIO, OFFICE, RETAIL, WAREHOUSE, LAND
   - Цена (price) - обязательное
   - Валюта (currency) - по умолчанию AED
   - Статус (status) - выбор из: AVAILABLE, SOLD, RENTED, RESERVED, UNAVAILABLE

2. **Характеристики:**
   - Площадь (area) - обязательное
   - Количество спален (bedrooms) - обязательное
   - Количество ванных (bathrooms) - обязательное
   - Парковочные места (parking) - опционально
   - Этаж (floor) - опционально
   - Всего этажей (totalFloors) - опционально
   - Год постройки (yearBuilt) - опционально
   - Дата сдачи (completionDate) - опционально

3. **Локация:**
   - Адрес (address) - обязательное
   - Город (city) - обязательное
   - Район (district) - обязательное
   - Район из списка (areaId) - выбор из базы данных
   - Координаты (coordinates) - опционально { lat, lng }

4. **Застройщик:**
   - Застройщик (developerId) - выбор из базы данных, опционально

5. **Медиа:**
   - Фотографии (images) - множественная загрузка
   - Планировки (floorPlans) - множественная загрузка

6. **Дополнительно:**
   - Особенности (features) - массив строк
   - Удобства (amenities) - массив строк
   - SEO: slug, metaTitle, metaDescription
   - Флаги: isPublished, isFeatured

## Этапы реализации

### Этап 1: Настройка инфраструктуры

1. Создать Prisma клиент утилиту (`src/lib/prisma.ts`)
   - Синглтон паттерн для Prisma Client
   - Обработка окружений (dev/prod)

2. Создать API endpoints для работы с недвижимостью:
   - `src/pages/api/properties/index.ts` - GET (список), POST (создание)
   - `src/pages/api/properties/[id].ts` - GET (детали), PUT (обновление), DELETE (удаление)
   - `src/pages/api/properties/upload.ts` - загрузка изображений
   - `src/pages/api/areas/index.ts` - GET список районов для выпадающего списка
   - `src/pages/api/developers/index.ts` - GET список застройщиков для выпадающего списка

3. Настроить хранение изображений:
   - Вариант 1: Локальное хранилище (`public/uploads/`)
   - Вариант 2: Внешний сервис (Cloudinary, AWS S3)
   - Создать API endpoint для загрузки

### Этап 2: Создание компонентов формы

1. Создать основной компонент формы:
   - `src/components/admin/PropertyForm.tsx`
   - Использовать react-hook-form для управления формой
   - Использовать zod для валидации
   - Разделить на секции (табы или аккордеон)

2. Создать компоненты для полей:
   - `src/components/admin/PropertyFormFields.tsx` - основные поля
   - `src/components/admin/PropertyFormLocation.tsx` - поля локации
   - `src/components/admin/PropertyFormMedia.tsx` - загрузка изображений
   - `src/components/admin/PropertyFormFeatures.tsx` - особенности и удобства
   - `src/components/admin/PropertyFormSEO.tsx` - SEO поля

3. Компонент загрузки изображений:
   - `src/components/admin/ImageUpload.tsx`
   - Поддержка множественной загрузки
   - Предпросмотр изображений
   - Удаление изображений
   - Drag & drop

### Этап 3: Интеграция с админ-панелью

1. Обновить AdminDashboard:
   - Добавить модальное окно для формы добавления
   - Добавить кнопку "Добавить недвижимость"
   - Интегрировать PropertyForm
   - Добавить список недвижимости из API
   - Добавить функции редактирования и удаления

2. Создать модальное окно:
   - `src/components/admin/PropertyModal.tsx`
   - Открывается при клике на "Добавить" или "Редактировать"
   - Закрывается после успешного сохранения

3. Обновить список недвижимости:
   - Загружать данные из API вместо моков
   - Добавить пагинацию
   - Добавить фильтры и поиск
   - Добавить действия: просмотр, редактирование, удаление

### Этап 4: Валидация и обработка ошибок

1. Создать схему валидации (zod):
   - `src/lib/validations/property.ts`
   - Валидация всех полей
   - Кастомные сообщения об ошибках

2. Обработка ошибок:
   - Отображение ошибок валидации
   - Обработка ошибок API
   - Показ уведомлений об успехе/ошибке

3. Состояния загрузки:
   - Loading состояния при сохранении
   - Disable кнопок во время загрузки
   - Skeleton loaders для списка

### Этап 5: Автогенерация slug и SEO

1. Автогенерация slug из названия:
   - Транслитерация для русского языка
   - Уникальность проверка
   - Автоматическое обновление при изменении названия

2. SEO поля:
   - Автогенерация metaTitle и metaDescription
   - Возможность ручного редактирования

### Этап 6: Тестирование и оптимизация

1. Тестирование формы:
   - Валидация всех полей
   - Проверка загрузки изображений
   - Проверка сохранения в БД
   - Проверка обновления

2. Оптимизация:
   - Оптимизация изображений перед сохранением
   - Ленивая загрузка компонентов
   - Мемоизация тяжелых вычислений

## Файлы для создания/изменения

### Новые файлы:
1. `src/lib/prisma.ts` - Prisma клиент
2. `src/pages/api/properties/index.ts` - API для списка и создания
3. `src/pages/api/properties/[id].ts` - API для деталей, обновления, удаления
4. `src/pages/api/properties/upload.ts` - API для загрузки изображений
5. `src/pages/api/areas/index.ts` - API для списка районов
6. `src/pages/api/developers/index.ts` - API для списка застройщиков
7. `src/components/admin/PropertyForm.tsx` - Основная форма
8. `src/components/admin/PropertyFormFields.tsx` - Поля формы
9. `src/components/admin/PropertyFormLocation.tsx` - Поля локации
10. `src/components/admin/PropertyFormMedia.tsx` - Загрузка медиа
11. `src/components/admin/PropertyFormFeatures.tsx` - Особенности
12. `src/components/admin/PropertyFormSEO.tsx` - SEO поля
13. `src/components/admin/ImageUpload.tsx` - Компонент загрузки
14. `src/components/admin/PropertyModal.tsx` - Модальное окно
15. `src/lib/validations/property.ts` - Схемы валидации
16. `src/lib/utils/slug.ts` - Утилита для slug
17. `public/locales/en/admin.json` - Добавить переводы полей формы
18. `public/locales/ru/admin.json` - Добавить переводы полей формы
19. `public/locales/ar/admin.json` - Добавить переводы полей формы

### Изменяемые файлы:
1. `src/components/admin/AdminDashboard.tsx` - Интеграция формы
2. `src/components/admin/AdminLogin.tsx` - Реальная авторизация (опционально)
3. `package.json` - Добавить зависимости если нужно (multer, sharp для изображений)

## Детальный чеклист реализации

### Фаза 1: Инфраструктура и API
- [ ] 1.1. Создать `src/lib/prisma.ts` с Prisma Client синглтоном
- [ ] 1.2. Создать API endpoint `GET/POST /api/properties` для списка и создания
- [ ] 1.3. Создать API endpoint `GET/PUT/DELETE /api/properties/[id]` для операций с одной записью
- [ ] 1.4. Создать API endpoint `POST /api/properties/upload` для загрузки изображений
- [ ] 1.5. Создать API endpoint `GET /api/areas` для списка районов
- [ ] 1.6. Создать API endpoint `GET /api/developers` для списка застройщиков
- [ ] 1.7. Настроить хранение изображений (создать папку `public/uploads/properties/`)
- [ ] 1.8. Добавить обработку ошибок в API endpoints

### Фаза 2: Валидация и утилиты
- [ ] 2.1. Создать `src/lib/validations/property.ts` с zod схемой валидации
- [ ] 2.2. Создать `src/lib/utils/slug.ts` для генерации slug
- [ ] 2.3. Добавить функцию транслитерации для русского языка

### Фаза 3: Компоненты формы
- [ ] 3.1. Создать `src/components/admin/ImageUpload.tsx` с поддержкой множественной загрузки
- [ ] 3.2. Создать `src/components/admin/PropertyFormFields.tsx` с основными полями
- [ ] 3.3. Создать `src/components/admin/PropertyFormLocation.tsx` с полями локации
- [ ] 3.4. Создать `src/components/admin/PropertyFormMedia.tsx` для загрузки медиа
- [ ] 3.5. Создать `src/components/admin/PropertyFormFeatures.tsx` для особенностей
- [ ] 3.6. Создать `src/components/admin/PropertyFormSEO.tsx` для SEO полей
- [ ] 3.7. Создать `src/components/admin/PropertyForm.tsx` - основную форму с react-hook-form
- [ ] 3.8. Интегрировать все компоненты в PropertyForm
- [ ] 3.9. Добавить валидацию через zod resolver
- [ ] 3.10. Добавить обработку отправки формы

### Фаза 4: Интеграция с админ-панелью
- [ ] 4.1. Создать `src/components/admin/PropertyModal.tsx` для модального окна
- [ ] 4.2. Обновить `AdminDashboard.tsx` - добавить кнопку "Добавить недвижимость"
- [ ] 4.3. Интегрировать PropertyModal в AdminDashboard
- [ ] 4.4. Заменить mock данные на реальный API запрос в AdminDashboard
- [ ] 4.5. Добавить функцию редактирования недвижимости
- [ ] 4.6. Добавить функцию удаления недвижимости с подтверждением
- [ ] 4.7. Добавить пагинацию для списка недвижимости
- [ ] 4.8. Добавить фильтры и поиск в список

### Фаза 5: Переводы и локализация
- [ ] 5.1. Добавить переводы полей формы в `public/locales/en/admin.json`
- [ ] 5.2. Добавить переводы полей формы в `public/locales/ru/admin.json`
- [ ] 5.3. Добавить переводы полей формы в `public/locales/ar/admin.json`
- [ ] 5.4. Интегрировать переводы в форму

### Фаза 6: Тестирование и финальная полировка
- [ ] 6.1. Протестировать создание новой недвижимости
- [ ] 6.2. Протестировать редактирование недвижимости
- [ ] 6.3. Протестировать удаление недвижимости
- [ ] 6.4. Протестировать загрузку изображений
- [ ] 6.5. Протестировать валидацию всех полей
- [ ] 6.6. Протестировать обработку ошибок
- [ ] 6.7. Проверить автогенерацию slug
- [ ] 6.8. Оптимизировать производительность
- [ ] 6.9. Добавить loading states
- [ ] 6.10. Добавить уведомления об успехе/ошибке

## Технические детали

### Структура данных Property (соответствует Prisma схеме):
```typescript
interface PropertyFormData {
  title: string
  description: string
  type: PropertyType
  price: number
  currency: string
  status: PropertyStatus
  area: number
  bedrooms: number
  bathrooms: number
  parking?: number
  floor?: number
  totalFloors?: number
  yearBuilt?: number
  completionDate?: Date
  address: string
  city: string
  district: string
  areaId: string
  developerId?: string
  coordinates?: { lat: number; lng: number }
  images: File[]
  floorPlans?: Array<{ file: File; title: string; area?: number; bedrooms?: number; bathrooms?: number }>
  features: string[]
  amenities: string[]
  slug: string
  metaTitle?: string
  metaDescription?: string
  isPublished: boolean
  isFeatured: boolean
}
```

### API Endpoints спецификация:

#### POST /api/properties
- Body: FormData (включая изображения)
- Response: { success: boolean, property: Property, message?: string }

#### GET /api/properties
- Query: ?page=1&limit=20&status=AVAILABLE
- Response: { properties: Property[], total: number, page: number, limit: number }

#### GET /api/properties/[id]
- Response: { property: Property }

#### PUT /api/properties/[id]
- Body: FormData
- Response: { success: boolean, property: Property }

#### DELETE /api/properties/[id]
- Response: { success: boolean, message: string }

#### POST /api/properties/upload
- Body: FormData с файлом
- Response: { success: boolean, url: string, filename: string }

## Примечания

1. **Безопасность:**
   - Все API endpoints должны проверять авторизацию админа
   - Валидация и санитизация всех входных данных
   - Ограничение размера загружаемых файлов
   - Проверка типов файлов (только изображения)

2. **Производительность:**
   - Оптимизация изображений перед сохранением (использовать sharp)
   - Ленивая загрузка списка недвижимости
   - Кэширование списков районов и застройщиков

3. **UX:**
   - Автосохранение черновиков (опционально)
   - Показ прогресса загрузки
   - Предпросмотр изображений перед загрузкой
   - Валидация в реальном времени

