# SGIP Real Estate Website - Implementation Plan

> 📖 **См. также**: [INDEX.md](./INDEX.md) - Индекс всей документации

## Project Overview

Corporate website for SGIP Real Estate agency targeting UAE, EU, and Russia markets.

## Technology Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes + Prisma ORM
- **Database**: PostgreSQL 16
- **Deployment**: Docker + Docker Compose
- **Styling**: Tailwind CSS + Headless UI
- **Icons**: Heroicons
- **Images**: Next.js Image optimization
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: next-i18next
- **Analytics**: Google Analytics 4 + Yandex Metrica

## Project Structure

```
sgipreal.com/
├── .docker/
├── .env.example
├── .env.local
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── next.config.js
├── package.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── images/
│   ├── icons/
│   └── locales/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── property/
│   │   └── forms/
│   ├── pages/
│   │   ├── api/
│   │   ├── admin/
│   │   └── [locale]/
│   ├── styles/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── utils/
└── README.md
```

## Phase 1: Project Setup and Foundation

### 1.1 Initialize Next.js Project

- [ ] Create Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint and Prettier
- [ ] Configure next.config.js for i18n and images

### 1.2 Database Setup

- [ ] Set up PostgreSQL with Docker
- [ ] Configure Prisma ORM
- [ ] Create database schema for properties, areas, developers, leads
- [ ] Set up database migrations

### 1.3 Docker Configuration

- [ ] Create Dockerfile for Next.js app
- [ ] Create docker-compose.yml with PostgreSQL
- [ ] Configure environment variables
- [ ] Set up development and production configurations

### 1.4 Basic Project Structure

- [ ] Create folder structure
- [ ] Set up TypeScript types
- [ ] Configure path aliases
- [ ] Set up utility functions

## Phase 2: Design System and UI Components

### 2.1 Design System Setup

- [ ] Configure Tailwind CSS with custom colors (Graphite #1E1F24, Champagne Gold #C9A86A, White #F7F7F8)
- [ ] Set up custom fonts (Manrope/Inter)
- [ ] Create spacing and typography scales
- [ ] Set up responsive breakpoints

### 2.2 Core UI Components

- [ ] Button component with variants
- [ ] Input and Form components
- [ ] Card component for properties
- [ ] Modal component
- [ ] Loading states and skeletons
- [ ] Navigation components

### 2.3 Layout Components

- [ ] Header with navigation and CTA
- [ ] Footer with links and contact info
- [ ] Mobile menu
- [ ] Breadcrumb navigation
- [ ] Page layout wrapper

## Phase 3: Core Pages and Features

### 3.1 Homepage

- [ ] Hero section with UTP
- [ ] Statistics section (10+ years, 500+ objects)
- [ ] Advantages section
- [ ] Featured properties carousel
- [ ] Partners section
- [ ] CTA sections

### 3.2 Properties Catalog

- [ ] Property grid layout
- [ ] Advanced filtering system (area, developer, price, type, rooms, completion date)
- [ ] Search functionality
- [ ] Sorting options
- [ ] Pagination
- [ ] Property card component

### 3.3 Property Detail Page

- [ ] Image gallery with lightbox
- [ ] Property specifications
- [ ] Floor plans section
- [ ] Infrastructure information
- [ ] Contact form for inquiries
- [ ] Related properties

### 3.4 Areas Pages

- [ ] Dynamic area pages
- [ ] Area information and statistics
- [ ] Properties in area
- [ ] SEO optimization

### 3.5 Developers Pages

- [ ] Developer profile pages
- [ ] Developer projects
- [ ] Company information
- [ ] Contact details

## Phase 4: Admin Panel

### 4.1 Admin Authentication

- [x] Simple admin login system (POST `/api/admin/login`, credentials from `ADMIN_USERNAME` / `ADMIN_PASSWORD`; httpOnly session cookie signed with `ADMIN_SESSION_SECRET`, required in production)
- [x] Session management (`GET /api/admin/session`, `POST /api/admin/logout`)
- [ ] Protected admin API routes (UI gated by cookie; property/area/developer APIs remain separate)

### 4.2 Property Management

- [ ] Add new property form
- [ ] Edit property form
- [ ] Property image upload
- [ ] Property status management
- [ ] Bulk operations

### 4.3 Content Management

- [ ] Area management
- [ ] Developer management
- [ ] Partner management
- [ ] Lead management

## Phase 5: Forms and Integrations

### 5.1 Contact Forms

- [ ] General contact form
- [ ] Property inquiry form
- [ ] Newsletter subscription
- [ ] Form validation and error handling

### 5.3 Analytics Integration

- [ ] Google Analytics 4 setup
- [ ] Yandex Metrica setup
- [ ] Google Tag Manager integration
- [ ] Event tracking

## Phase 6: Internationalization

### 6.1 Multi-language Setup

- [ ] Configure next-i18next
- [ ] Create translation files (RU/EN)
- [ ] Language switcher component
- [ ] URL structure for different languages

### 6.2 Content Translation

- [ ] Translate all static content
- [ ] Translate dynamic content (properties, areas)
- [ ] Admin panel translations

## Phase 7: Performance and SEO

### 7.1 Performance Optimization

- [ ] Image optimization with Next.js Image
- [ ] Code splitting and lazy loading
- [ ] Bundle analysis and optimization
- [ ] CDN configuration

### 7.2 SEO Implementation

- [ ] Meta tags and Open Graph
- [ ] Schema.org markup for properties
- [ ] Sitemap generation
- [ ] Robots.txt configuration
- [ ] URL structure optimization

## Phase 8: Testing and Deployment

### 8.1 Testing

- [ ] Unit tests for utilities
- [ ] Component testing
- [ ] Integration testing
- [ ] E2E testing for critical flows

### 8.2 Deployment

- [ ] Production Docker configuration
- [ ] Environment variables setup
- [ ] Database migration scripts
- [ ] SSL certificate configuration
- [ ] Domain configuration

## Phase 9: Monitoring and Maintenance

### 9.1 Monitoring Setup

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database monitoring

### 9.2 Documentation

- [ ] API documentation
- [ ] Admin panel user guide
- [ ] Deployment guide
- [ ] Maintenance procedures

## Success Criteria

- [ ] Site loads in <2 seconds
- [ ] Mobile PageSpeed score >85
- [ ] All forms working and sending data
- [ ] Multi-language functionality working
- [ ] Admin panel allows easy property management
- [ ] SEO optimization complete
- [ ] Responsive design on all devices
- [ ] Analytics tracking working

## Timeline Estimate

- **Phase 1-2**: 2-3 days (Setup and Design System)
- **Phase 3**: 5-7 days (Core Pages)
- **Phase 4**: 3-4 days (Admin Panel)
- **Phase 5**: 2-3 days (Forms and Integrations)
- **Phase 6**: 2-3 days (Internationalization)
- **Phase 7**: 2-3 days (Performance and SEO)
- **Phase 8**: 2-3 days (Testing and Deployment)
- **Phase 9**: 1-2 days (Monitoring and Documentation)

**Total Estimated Time**: 19-28 days

## Content and public info updates (April 2026)

- ✅ Home statistics: 13+ and 1280+ (EN labels “Years experience” / “Sold”; RU/AR aligned); third stat client satisfaction unchanged.
- ✅ Home advantages: full-cycle block uses grid icon; EN title/description match client brief (“Company with Full Cycle”; “Rent, Buy-Sell, Investment, Business Consultancy”); RU/AR equivalents in `home.json`.
- ✅ Services page: hero shows two stats only (13+ years, 1280+ sold); service card headers use Lucide line icons (Building2, Tag, Home, Briefcase); benefits grid reduced to four pillars including full-cycle (EN/RU/AR); fixed duplicate `process`/`benefits` keys in `en/services.json`; card “Key benefits” heading uses `features.benefitsTitle`.
- ✅ About: Our Story as multi-paragraph text (EN/RU/AR); Rustam — Founder & CEO + UAE transactions / company growth (EN/RU/AR).
- ✅ FAQ: buying documents (NOC list), buying process punctuation and 2–6 weeks; selling costs + DEWA/Empower; “renovate before selling” removed earlier; renting docs; property management answer (EN/RU/AR aligned).
- ✅ Contact email: `admin@sgipreal.com` via `NEXT_PUBLIC_CONTACT_EMAIL` (default in code). Contact page lists team addresses `ru@`, `alex@`, `elza@` with `NEXT_PUBLIC_EMAIL_*` overrides (`.env.example` documents keys).
- ✅ Footer and contact: Instagram, YouTube, LinkedIn defaults (new tab); globe icon decorative only (no URL per client brief); WhatsApp widget and contact block highlight WhatsApp/Telegram and `0505807871`; WhatsApp & Telegram deep links default `971505807871` / `https://t.me/+971505807871`.
- ✅ FAQ answers: `whitespace-pre-line` for multi-line buying-process steps (EN/RU/AR).
- ✅ Header/footer: larger logos, optional `NEXT_PUBLIC_LOGO_HEADER` / `NEXT_PUBLIC_LOGO_FOOTER`, subtle header contrast background for visibility.
- ✅ Env: `.env.example` documents logo paths, team emails, `NEXT_PUBLIC_TELEGRAM_URL` (optional alongside `NEXT_PUBLIC_TELEGRAM_USERNAME`).
- ⏳ Hosting: create and sync mailboxes `admin@`, `ru@`, `alex@`, `elza@` in your mail provider (not done in app code).
- ✅ Admin login: env-based credentials and signed httpOnly cookie; `.env.example` documents `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.

## Admin, listings model & catalog (April 2026 — TZ primary/secondary, developers, areas)

- ✅ Prisma: `ListingMarket` (PRIMARY | SECONDARY), `OccupancyStatus`, `paymentPlan`, `listingMarket` on `Property`; `isActive`, `image`, `sortOrder`, `tags` on `Area`; `isActive` on `Developer`. Existing rows default to PRIMARY via `@default(PRIMARY)` after `db push`.
- ✅ Properties API: create/update with conditional developer/payment/occupancy; GET filters `listingMarket`, `areaId`, `developerId`, `sort`.
- ✅ Areas REST: `GET/POST /api/areas`, `PUT/DELETE /api/areas/item/[id]`, `POST /api/areas/upload-image`; delete warns via 409 + optional `force=1` to unlink listings.
- ✅ Developers REST: `GET` (public vs `admin=1`), `POST /api/developers`, `PUT/DELETE /api/developers/item/[id]` with same linked-listing behaviour.
- ✅ Admin UI: sidebar tabs Developers & Areas with full CRUD; property form: market type, conditional fields, area/developer directory selects, quick add area/developer.
- ✅ Public catalog: filters by listing type, areas from API (`areaIds`), developer filter hidden for secondary; sort “newest/oldest” uses `createdAt`; cards show Primary/Secondary badge, developer/logo or year/occupancy; detail page shows payment plan and occupancy.
- ⏳ Deploy DB: run `npx prisma db push` (or migrate) on each environment with PostgreSQL running.
