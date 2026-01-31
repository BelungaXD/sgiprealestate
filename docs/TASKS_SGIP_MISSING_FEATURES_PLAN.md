# SGIP Real Estate — Missing Features Implementation Plan

> 📖 **См. также**: [INDEX.md](./INDEX.md) - Индекс всей документации

This document enumerates requirements from the provided Technical Specification (ТЗ), maps them to the current codebase, highlights gaps, and defines precise implementation steps and acceptance checks. No code is executed by this document.

## Legend

- ✅ Already implemented and verified in code
- ⏳ Partially present, needs completion
- ❌ Missing, to implement

## 1) Pages and Structure

- Home: ✅ Exists (`src/pages/index.tsx`) with sections in `src/components/sections/`. UAE-only copy fixed.
- Properties (catalog): ⏳ Exists (`src/pages/properties.tsx`) with sample data. Needs real filters and data from DB.
- Property detail: ⏳ Exists (`src/pages/properties/[id].tsx`) and components under `src/components/property/`. Needs SEO schema and lead forms per spec.
- Areas: ✅ Dynamic route exists (`src/pages/areas/[slug].tsx`), content components present.
- Developers: ✅ Page exists (`src/pages/developers.tsx`), enrich content and logos.
- Partners: ❌ Page missing. Component `src/components/sections/Partners.tsx` exists; create dedicated page and CMS fields.
- Services: ✅ Page exists (`src/pages/services.tsx`).
- Market/Blog: ❌ Missing section; create `src/pages/market` and `src/pages/blog` or unified `src/pages/market.tsx` and dynamic posts.
- Contacts: ✅ Page exists (`src/pages/contact.tsx`). Needs Google Maps embed and GDPR texts.
- About: ✅ Page exists (`src/pages/about.tsx`).
- Legal pages: ✅ `privacy.tsx` exists; ❌ `cookies` and `terms` pages missing.

## 2) Functional Requirements

- Fixed header with CTA: ⏳ `src/components/layout/Header.tsx` exists; ensure persistent CTA and WhatsApp button.
- Floating messenger widget (WhatsApp, Telegram) on all pages: ❌ Missing global widget.
- WhatsApp in header and property cards: ⏳ Header missing; property cards need CTA button.
- SEO & analytics: ⏳ Sitemap/robots present; i18n EN/RU/AR ready; GA4/YM via GTM not wired.
- Schema Markup: ❌ Add JSON-LD for Organization, WebSite, BreadcrumbList, Product/RealEstateListing.
- Performance: ⏳ Next Image/AVIF/WebP configured; add code-splitting on heavy sections, lazy components, and preconnects.

## 3) Design & Content

- Palette and fonts: ✅ Tailwind present; confirm Manrope/Inter loaded; tune theme if needed.
- Partner/developer logos: ⏳ Add SVG/PNG assets.
- RU/EN content: ⏳ Present. AR added. Provide missing keys progressively.
- Animations: ✅ Framer Motion available; apply sparingly.

## 4) Technical Setup

- Cloudflare: ❌ Infra task (outside code) but add security headers and image domains in `next.config.js` (done). Document DNS/SSL steps.
- .ru mirror with GeoIP redirect: ❌ Implement runtime geo redirect middleware for `.ru` or Cloudflare worker instructions.
- CDN: ⏳ Cloudflare usage documented; add image loader config if needed.
- Security: ⏳ Basic headers set; add rate limiting to forms.
- GTM: ❌ Add GTM script wrapper and env configuration.

---

## Implementation Steps (Exact File Targets)

### A) Header CTA and WhatsApp

1. Update `src/components/layout/Header.tsx` to include persistent CTA buttons: "Get Quote" and WhatsApp (link from `public/locales/*/common.json`).
2. Add WhatsApp button to `src/components/property/PropertyCard` or list item used in `PropertyGrid.tsx`.

### B) Floating Messenger Widget (WhatsApp + Telegram)

1. Create `src/components/ui/MessengerWidget.tsx` (fixed positioned). Config via env keys and translations. Render in `src/components/layout/Layout.tsx`.

### C) Catalog Filters

1. Implement server data: generate Prisma client and query properties in `src/pages/properties.tsx` (getServerSideProps). Use model `Property` and related enums.
2. Create controlled filters in `src/components/property/PropertyFilter.tsx` bound to querystring: area, developer, price, type, rooms, completionDate.
3. Persist selection in URL; SSR filter logic reads query params and Prisma filters map.

### D) Property Detail — SEO + Lead

1. Add JSON-LD in `src/pages/properties/[id].tsx` for RealEstateListing.
2. Implement lead form submission handler in `src/pages/api/leads.ts` (or dedicated folder), with validation (Zod) and spam protection.
3. Add WhatsApp CTA and PDF lead magnet download.

### E) Partners Page

1. Add `src/pages/partners.tsx` with list from DB table `Partner` (model exists). Add translations under `public/locales/*/partners.json`.

### F) Market/Blog Section

1. Add `src/pages/market/index.tsx` and `src/pages/market/[slug].tsx`.
2. Store posts in DB or MDX; start with MDX under `content/market/` and `next-mdx-remote` if permitted, otherwise Prisma `Post` model to be added (phase 2).

### G) Contacts — Google Maps + GDPR

1. Add Google Maps via static embed or JS API key `GOOGLE_MAPS_API_KEY` to `ContactInfo.tsx`.
2. Add GDPR consent strings to `public/locales/*/contact.json` and checkbox validation.

### H) Legal Pages

1. Create `src/pages/cookies.tsx` and `src/pages/terms.tsx` with translations `public/locales/*/(cookies|terms).json`.

### K) Analytics via GTM (GA4 + Yandex)

1. Add `src/components/analytics/GTM.tsx` to inject GTM head/body with `GTM_ID` env.
2. Push events on form submit and key interactions.

### L) Schema Markup (JSON-LD)

1. Add `Organization` and `WebSite` JSON-LD to `_app.tsx` or `index.tsx`.
2. Add `BreadcrumbList` to key pages.

### M) GeoIP Redirect for .ru Mirror

1. Implement `src/middleware.ts` to read Cloudflare country header and redirect `.ru` users to `sgipreal.ru` (document Cloudflare config alternative).

### O) Security and Performance

1. Add simple rate limiting on API routes (in-memory or upstash/redis if available).
2. Lazy-load heavy components and images; add Next.js `preconnect` and `dns-prefetch` in `Head`.

### P) i18n

1. Ensure `ar` coverage for `common`, `home`, `services`, `contact`, and new pages; fallback to `en` when missing.
2. Add language switcher in header if not present.

---

## Acceptance Checks

- Home: UAE-only copy; WhatsApp CTA visible; messenger widget visible on all pages.
- Catalog: Filters work and persist via URL; SSR delivers filtered results.
- Property: JSON-LD valid in Rich Results Test; lead form works correctly.
- Partners: Page lists partners with logos and links.
- Market/Blog: Index and post pages render; basic SEO.
- Contacts: Google Maps shows; GDPR consent enforced.
- Legal: Privacy, Cookies, Terms available and linked in footer.
- Analytics: GTM installed; GA4 and Yandex tags firing.
- GeoIP: `.ru` redirect behavior works via middleware or Cloudflare config.
- Performance: LCP < 2s on mobile in PSI; images WebP/AVIF.

---

## Implementation Checklist

1. Add header CTAs (Get Quote + WhatsApp) in `Header.tsx` and property cards.
2. Create floating messenger widget and mount in `Layout.tsx`.
3. Wire Prisma-backed catalog with SSR filters and `PropertyFilter` binding.
4. Add JSON-LD to home and property detail.
5. Implement lead API and hook it to forms; add WhatsApp CTA and PDF download.
6. Create `pages/partners.tsx` and translations.
7. Scaffold Market/Blog (index + [slug]).
8. Add Google Maps embed and GDPR consent to Contact.
9. Create Cookies and Terms pages and translations.
10. Add GTM wrapper; configure GA4 + Yandex.
11. Implement GeoIP redirect middleware for `.ru` users.
12. ~~Create email send API using SMTP; test with Mailhog.~~ (Removed)
13. Add basic rate limiting to API routes.
14. Optimize performance: lazy-load, preconnect, image domains, bundle checks.
15. Expand AR translations and add language switcher if missing.
