# SGIP Real Estate Website

A premium real estate website for SGIP Real Estate agency, targeting international markets (UAE, EU, Russia) with multi-language support and modern design.

## Features

- 🏠 **Property Listings** - Advanced property catalog with filtering
- 🌍 **Multi-language** - English and Russian support
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Performance** - Optimized for speed and SEO
- 🎨 **Modern UI** - Premium design with Tailwind CSS
- 🔧 **Admin Panel** - Easy property management
- 📊 **Analytics** - Google Analytics 4 and Yandex Metrica ready
- 💬 **WhatsApp Integration** - Direct communication widget

## Technology Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **Database**: PostgreSQL + Prisma ORM
- **Deployment**: Docker + Docker Compose
- **Internationalization**: next-i18next

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL (or use Docker)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sgiprealestate.com
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the database:
```bash
docker-compose -f docker-compose.dev.yml up -d postgres
```

5. Run database migrations:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components (Header, Footer)
│   ├── property/       # Property-related components
│   └── sections/       # Page sections
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   └── admin/          # Admin panel pages
├── styles/             # Global styles
├── lib/                # Utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Environment Variables

See `.env.example` for all required environment variables.

## Deployment

### Using Docker

1. Build the production image:
```bash
docker build -t sgip-real-estate .
```

2. Start with Docker Compose:
```bash
docker-compose up -d
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is proprietary and confidential.

## Support

For support, email info@sgiprealestate.com or contact us through the website.
