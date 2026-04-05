# SGIP Real Estate Website

Корпоративный сайт агентства элитной недвижимости SGIP Real Estate для международного рынка (ОАЭ, ЕС, РФ).

## 📋 Общие сведения о проекте

**Название проекта**: Корпоративный сайт агентства элитной недвижимости SGIP Real Estate  
**Цель**: Разработка функционального, адаптивного и визуально премиального сайта с каталогом объектов, интеграцией форм и аналитикой  
**Платформа**: Самописный сайт  
**Основной домен**: sgipreal.com (через Cloudflare)  
**Зеркало для РФ**: sgipreal.ru (с редиректом по GeoIP)  
**Срок реализации**: 8 недель (34 рабочих дня)

## 🏗️ Структура сайта

### Основные разделы

- **Главная (Home)**: оффер, статистика (13+ лет опыта команды на рынке ОАЭ, 1280+ сделок), преимущества, CTA, топ-проекты, партнёры
- **Каталог (Properties)**: фильтры по району, застройщику, цене, типу, количеству комнат, дате готовности
- **Карточка объекта**: галерея, параметры, планировки, инфраструктура, запрос расчёта, SEO-разметка
- **Раздел Areas**: SEO-страницы по районам
- **Раздел Developers**: описание 10–15 застройщиков (Emaar, Damac, Sobha и др.) с логотипами
- **Раздел Partners**: банки, страховые, консалтинг
- **Раздел Services**: покупка, продажа, аренда, управление, ипотека, бизнес в ОАЭ, Swiss Investment
- **Раздел Market/Blog**: аналитика и новости
- **Раздел Contacts**: карта Google Maps, офисы, форма с GDPR
- **Раздел About**: о компании, команда, отчёты о рынке

### Юридические страницы

- Privacy Policy
- Cookies Policy
- Terms & Conditions

## ✨ Функциональные требования

### 1. Дизайн и UX

- ✅ Адаптация под мобильные устройства
- ✅ Фиксированный Header с CTA
- ✅ Плавные анимации без перегрузки интерфейса

### 2. Интеграция связи

- ✅ Плавающий виджет мессенджеров (WhatsApp, Telegram) на всех страницах
- ✅ Кнопка WhatsApp в Header и карточках объектов

### 3. Лидогенерация

- ✅ Загрузка PDF-лид-магнита
- ✅ GDPR-согласие в формах

### 5. SEO и аналитика

- ✅ Мультиязычность: RU/EN/AR
- ✅ Настройка GA4 и Яндекс.Метрики через GTM
- ✅ Sitemap.xml и robots.txt
- ✅ Schema Markup (Organization, ItemList, RealEstateListing)
- ✅ Человекопонятные URL карточек объектов: `/properties/mirage-the-oasis-dubai` вместо `/properties/cml8gytat000huyo10zir39wz`; старые ссылки по CUID редиректятся 301 на slug

### 6. Производительность

- ✅ Скорость загрузки <2 секунд
- ✅ Lazy-load изображений
- ✅ Изображения в WebP
- ✅ Оптимизация по PageSpeed Insights

## 🎨 Дизайн и контент

### Цветовая палитра

- **Графит**: #1E1F24
- **Шампанское золото**: #C9A86A
- **Белый**: #F7F7F8

### Шрифты

- Manrope / Inter

### Изображения

- Премиальные, светлые, без избыточного HDR
- Логотипы партнёров и застройщиков: SVG/PNG с прозрачным фоном

### Контент

- Тексты на русском, английском и арабском языках
- Анимации: плавные, лёгкие

## 🛠️ Технологический стек

### Frontend

- **Framework**: Next.js 14 (Pages Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **Icons**: Heroicons

### Backend

- **Database**: PostgreSQL
- **ORM**: Prisma
- **API**: Next.js API Routes

### Интеграции

- **Internationalization**: next-i18next
- **Analytics**: Google Analytics 4, Yandex Metrica, Google Tag Manager
- **Maps**: Google Maps API

### Deployment

- **Containerization**: Docker + Docker Compose
- **CDN**: Cloudflare
- **Hosting**: Cloudflare (с поддержкой .ru зеркала)

## 🚀 Быстрый старт

### Prerequisites

- Node.js 20+
- Docker and Docker Compose (опционально)
- PostgreSQL (или используйте Docker)

### Installation

1. Клонируйте репозиторий:

```bash
git clone https://github.com/BelungaCZ/sgiprealestate.git
cd sgipreal.com
```

1. Установите зависимости:

```bash
npm install
```

1. Настройте environment variables:

```bash
cp .env.example .env.local
# Отредактируйте .env.local с вашей конфигурацией
```

1. Запустите базу данных (если используете Docker):

```bash
docker-compose -f docker-compose.dev.yml up -d postgres
```

1. Выполните миграции базы данных:

```bash
npm run db:push
```

1. Запустите dev сервер:

```bash
npm run dev
```

1. Откройте приложение в браузере (порт настраивается через переменную PORT в .env файле).

## 📁 Структура проекта

```
src/
├── components/          # React компоненты
│   ├── ui/             # Переиспользуемые UI компоненты
│   ├── layout/         # Компоненты макета (Header, Footer)
│   ├── property/       # Компоненты для объектов недвижимости
│   ├── areas/          # Компоненты для районов
│   ├── developers/     # Компоненты для застройщиков
│   ├── services/       # Компоненты для услуг
│   ├── contact/        # Компоненты контактов
│   ├── about/          # Компоненты "О нас"
│   ├── sections/       # Секции страниц
│   ├── analytics/      # Компоненты аналитики
│   └── admin/          # Компоненты админ-панели
├── pages/              # Next.js страницы
│   ├── api/            # API маршруты
│   ├── admin/          # Страницы админ-панели
│   ├── areas/          # Страницы районов
│   ├── properties/     # Страницы объектов
│   └── market/         # Блог/рынок
├── styles/             # Глобальные стили
├── lib/                # Утилиты
├── hooks/              # Кастомные React хуки
├── types/              # TypeScript типы
└── utils/              # Вспомогательные функции
```

## 📜 Доступные команды

- `npm run dev` - Запуск dev сервера
- `npm run build` - Сборка для production
- `npm run start` - Запуск production сервера
- `npm run lint` - Запуск ESLint
- `npm run db:generate` - Генерация Prisma client
- `npm run db:push` - Применение схемы базы данных
- `npm run db:migrate` - Запуск миграций базы данных
- `npm run db:studio` - Открытие Prisma Studio

## 🔐 Environment Variables

См. `.env.example` для всех необходимых переменных окружения. Основные переменные:

### Analytics

- `NEXT_PUBLIC_GTM_ID` - Google Tag Manager ID

### Communication

- `NEXT_PUBLIC_WHATSAPP_NUMBER` - WhatsApp номер
- `NEXT_PUBLIC_TELEGRAM_USERNAME` - Telegram username

### Maps

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API ключ

### Integrations

## 🌐 Развёртывание

### Использование Docker

1. Соберите production образ:

```bash
docker build -t sgip-real-estate .
```

1. Запустите с Docker Compose:

```bash
docker-compose up -d
```

### Ручное развёртывание

1. Соберите приложение:

```bash
npm run build
```

1. Запустите production сервер:

```bash
npm run start
```

## ⚙️ Техническая настройка

### Домен и хостинг

1. Перенос sgipreal.com на Cloudflare
2. Настройка DNS и SSL
3. Зеркало .ru: регистрация и настройка редиректа для пользователей из РФ

### Почта

1. Создание корпоративных ящиков
2. Настройка SPF, DKIM, DMARC

### CDN

- Использование Cloudflare для ускорения загрузки (Европа, ОАЭ, США)

### Безопасность

- HTTPS
- Защита форм и базовых данных

### Nginx Configuration and Deployment

Deployment works like other ecosystem services (e.g. notifications-microservice):

- **Deploy**: Run `./scripts/deploy.sh` from the project root (on the production server).
- **Nginx configs and service registry** are generated automatically during deployment by nginx-microservice's `deploy-smart.sh`. Do not create or edit `service-registry` files in this repo.
- **Redirects** (HTTP→HTTPS, www→canonical) are configured in nginx-microservice templates.
- **All API routes are managed by this application**: single Next.js container; no separate backend. So `/api/*` (e.g. `/api/uploads`, `/api/properties`) and `/_next/static/*` must be proxied to the same frontend. See [docs/NGINX_AND_API_ROUTES.md](./docs/NGINX_AND_API_ROUTES.md).

Reference: [`nginx-templates/`](./nginx-templates/), [`nginx.config.json`](./nginx.config.json), and [`nginx/nginx-api-routes.conf`](./nginx/nginx-api-routes.conf). The `nginx.client_max_body_size` from nginx.config.json is read during deploy and applied to allow large file uploads (e.g. 10G for folder imports).

**413 Payload Too Large when uploading folders**: If uploads >100MB fail:

- Установка GA4 и Яндекс.Метрики через GTM
- Настройка событий и конверсий

## ✅ Критерии приёмки

1. ✅ Сайт полностью функционален и адаптивен на всех устройствах
2. ✅ Все формы работают корректно
3. ✅ SEO-разметка и мультиязычность функционируют корректно
4. ✅ Скорость загрузки ≤ 2 сек по PageSpeed Insights (мобильная версия не ниже 85 баллов)
5. ✅ Контент, изображения и структура соответствуют ТЗ
6. ✅ Почта и домены корректно настроены (SPF/DKIM/DMARC пройдены)
7. ✅ Визуальное исполнение соответствует бренд-гайду SGIP Real Estate

## 📊 Мультиязычность

Сайт поддерживает три языка:

- **Русский (ru)** - основной язык для РФ
- **Английский (en)** - основной язык для международного рынка
- **Арабский (ar)** - для рынка ОАЭ

Переводы хранятся в `public/locales/{locale}/` директории.

## 🔗 Интеграции

### Analytics

- Google Analytics 4
- Yandex Metrica
- Google Tag Manager

### Maps

- Google Maps API

## 📚 Документация

Вся документация проекта собрана в папке [`docs/`](./docs/):

- [Индекс документации](./docs/INDEX.md) - Навигация по всей документации
- [План реализации](./docs/IMPLEMENTATION_PLAN.md) - Детальный план разработки
- [План недостающих функций](./docs/TASKS_SGIP_MISSING_FEATURES_PLAN.md) - Реализация недостающих функций
- [Настройка деплоя](./docs/DEPLOYMENT_PERMISSIONS_SETUP.md) - Настройка прав для деплоя
- [Быстрая настройка](./docs/QUICK_SETUP.md) - Быстрый старт для деплоя
- [Перенос контента](./docs/CONTENT_TRANSFER_GUIDE.md) - Руководство по переносу контента
- [Отчёт о тестировании](./docs/TEST_REPORT.md) - Результаты тестирования

## 📜 Скрипты

Все скрипты проекта собраны в папке [`scripts/`](./scripts/):

- [README скриптов](./scripts/README.md) - Описание всех скриптов проекта
- Скрипты деплоя: `deploy.sh`, `setup-deploy-permissions.sh`
- Скрипты работы с контентом: `extract-content.js`, `integrate-content.js`
- Скрипты управления данными: `import-properties-from-folders.ts`, `update-developer-*.js`

## 📝 Лицензия

Этот проект является проприетарным и конфиденциальным.

## 💬 Поддержка

Для поддержки обращайтесь по email: <admin@sgipreal.com> или через форму на сайте.

## 📞 Контакты

- **Website**: <https://sgipreal.com>
- **Email**: <admin@sgipreal.com>
- **GitHub**: <https://github.com/BelungaCZ/sgiprealestate>
