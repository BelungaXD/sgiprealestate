import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import DeveloperCard from '@/components/developers/DeveloperCard'
import DeveloperStats from '@/components/developers/DeveloperStats'

interface Developer {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  logo: string
  founded: number
  headquarters: string
  propertiesCount: number
  averagePrice: number
  currency: string
  slug: string
  website: string
  specialties: string[]
  notableProjects: string[]
  awards: string[]
  rating: number
  marketShare: number
  countries: string[]
}

export default function Developers() {
  const { t } = useTranslation('developers')

  // Mock data - in real app this would come from API
  const developers: Developer[] = [
    {
      id: '1',
      name: 'Эмаар Пропертис',
      nameEn: 'Emaar Properties',
      description: 'Ведущий застройщик недвижимости в ОАЭ, известный своими инновационными проектами и качеством строительства.',
      descriptionEn: 'Leading real estate developer in the UAE, known for innovative projects and construction quality.',
      logo: '/images/developers/emaar.png',
      founded: 1997,
      headquarters: 'Dubai, UAE',
      propertiesCount: 1250,
      averagePrice: 2800000,
      currency: 'AED',
      slug: 'emaar-properties',
      website: 'https://www.emaar.com',
      specialties: ['Luxury Residences', 'Shopping Malls', 'Hotels', 'Mixed-Use Developments'],
      notableProjects: ['Burj Khalifa', 'Dubai Mall', 'Downtown Dubai', 'Dubai Hills Estate'],
      awards: ['Best Developer 2023', 'Excellence in Design', 'Sustainable Development Award'],
      rating: 4.8,
      marketShare: 25.5,
      countries: ['UAE', 'Egypt', 'India', 'Turkey']
    },
    {
      id: '2',
      name: 'Дамак Пропертис',
      nameEn: 'Damac Properties',
      description: 'Международный застройщик с фокусом на роскошные резиденции и курортные проекты.',
      descriptionEn: 'International developer focused on luxury residences and resort projects.',
      logo: '/images/developers/damac.png',
      founded: 2002,
      headquarters: 'Dubai, UAE',
      propertiesCount: 890,
      averagePrice: 2200000,
      currency: 'AED',
      slug: 'damac-properties',
      website: 'https://www.damacproperties.com',
      specialties: ['Luxury Villas', 'Resort Communities', 'Golf Courses', 'Waterfront Properties'],
      notableProjects: ['Damac Hills', 'Akoya Oxygen', 'Aykon City', 'Cavalli Tower'],
      awards: ['Luxury Developer Award', 'Best Golf Community', 'Innovation in Design'],
      rating: 4.6,
      marketShare: 18.2,
      countries: ['UAE', 'Saudi Arabia', 'Qatar', 'Lebanon']
    },
    {
      id: '3',
      name: 'Собха Риэлти',
      nameEn: 'Sobha Realty',
      description: 'Индийский застройщик с репутацией качества и внимания к деталям в каждом проекте.',
      descriptionEn: 'Indian developer with a reputation for quality and attention to detail in every project.',
      logo: '/images/developers/sobha.png',
      founded: 1995,
      headquarters: 'Bangalore, India',
      propertiesCount: 450,
      averagePrice: 1800000,
      currency: 'AED',
      slug: 'sobha-realty',
      website: 'https://www.sobharealty.com',
      specialties: ['Residential Complexes', 'Commercial Spaces', 'Integrated Townships', 'Affordable Housing'],
      notableProjects: ['Sobha Hartland', 'Sobha Creek Vistas', 'Sobha Reserve', 'Sobha One Park Avenue'],
      awards: ['Quality Excellence Award', 'Customer Satisfaction Award', 'Sustainable Development'],
      rating: 4.7,
      marketShare: 12.8,
      countries: ['UAE', 'India', 'Bahrain']
    },
    {
      id: '4',
      name: 'Нахил',
      nameEn: 'Nakheel',
      description: 'Создатель знаковых проектов Дубая, включая Пальм Джумейра и Дубай Марина.',
      descriptionEn: 'Creator of Dubai\'s iconic projects including Palm Jumeirah and Dubai Marina.',
      logo: '/images/developers/nakheel.png',
      founded: 2001,
      headquarters: 'Dubai, UAE',
      propertiesCount: 2100,
      averagePrice: 3500000,
      currency: 'AED',
      slug: 'nakheel',
      website: 'https://www.nakheel.com',
      specialties: ['Waterfront Developments', 'Island Projects', 'Marina Communities', 'Mixed-Use'],
      notableProjects: ['Palm Jumeirah', 'Dubai Marina', 'Jumeirah Islands', 'Ibn Battuta Mall'],
      awards: ['Iconic Development Award', 'Marina Excellence', 'Innovation in Waterfront'],
      rating: 4.5,
      marketShare: 22.1,
      countries: ['UAE']
    },
    {
      id: '5',
      name: 'Мераас',
      nameEn: 'Meraas',
      description: 'Современный застройщик, создающий уникальные городские пространства и развлекательные комплексы.',
      descriptionEn: 'Modern developer creating unique urban spaces and entertainment complexes.',
      logo: '/images/developers/meraas.png',
      founded: 2007,
      headquarters: 'Dubai, UAE',
      propertiesCount: 320,
      averagePrice: 1900000,
      currency: 'AED',
      slug: 'meraas',
      website: 'https://www.meraas.com',
      specialties: ['Entertainment Districts', 'Urban Regeneration', 'Retail Developments', 'Lifestyle Communities'],
      notableProjects: ['City Walk', 'La Mer', 'Bluewaters Island', 'Dubai Parks and Resorts'],
      awards: ['Urban Innovation Award', 'Entertainment Excellence', 'Lifestyle Development'],
      rating: 4.4,
      marketShare: 8.9,
      countries: ['UAE']
    },
    {
      id: '6',
      name: 'Альдар Пропертис',
      nameEn: 'Aldar Properties',
      description: 'Ведущий застройщик Абу-Даби, специализирующийся на устойчивом развитии и инновационных проектах.',
      descriptionEn: 'Leading Abu Dhabi developer specializing in sustainable development and innovative projects.',
      logo: '/images/developers/aldar.png',
      founded: 2005,
      headquarters: 'Abu Dhabi, UAE',
      propertiesCount: 680,
      averagePrice: 2400000,
      currency: 'AED',
      slug: 'aldar-properties',
      website: 'https://www.aldar.com',
      specialties: ['Sustainable Development', 'Cultural Districts', 'Business Parks', 'Residential Communities'],
      notableProjects: ['Yas Island', 'Al Raha Beach', 'Al Reem Island', 'Saadiyat Island'],
      awards: ['Sustainable Development Award', 'Cultural Excellence', 'Innovation in Design'],
      rating: 4.6,
      marketShare: 15.3,
      countries: ['UAE', 'Egypt']
    }
  ]

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
        <meta property="og:title" content={t('title')} />
        <meta property="og:description" content={t('description')} />
        <meta property="og:type" content="website" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": t('title'),
              "description": t('description'),
              "numberOfItems": developers.length,
              "itemListElement": developers.map((developer, index) => ({
                "@type": "Organization",
                "position": index + 1,
                "name": developer.nameEn,
                "description": developer.descriptionEn,
                "url": `/developers/${developer.slug}`,
                "logo": developer.logo,
                "foundingDate": developer.founded.toString(),
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": developer.headquarters
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": developer.rating,
                  "ratingCount": developer.propertiesCount
                }
              }))
            })
          }}
        />
      </Head>

      <Layout>
        <div className="bg-white">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-graphite to-gray-800 text-white">
            <div className="container-custom py-16">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  {t('title')}
                </h1>
                <p className="text-xl text-gray-200 mb-8">
                  {t('description')}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {developers.length} {t('developers')}
                  </div>
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {developers.reduce((sum, dev) => sum + dev.propertiesCount, 0)} {t('properties')}
                  </div>
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {t('premiumDevelopers')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Developers Grid */}
          <div className="container-custom py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {developers.map((developer) => (
                <DeveloperCard key={developer.id} developer={developer} />
              ))}
            </div>
          </div>

          {/* Developer Statistics */}
          <div className="bg-gray-50 py-16">
            <div className="container-custom">
              <DeveloperStats developers={developers} />
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-champagne py-16">
            <div className="container-custom text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/properties"
                  className="bg-white text-champagne px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  {t('cta.viewProperties')}
                </a>
                <a
                  href="/contact"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-champagne transition-colors"
                >
                  {t('cta.contactUs')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'developers'])),
    },
  }
}
