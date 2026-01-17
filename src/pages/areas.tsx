import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Layout from '@/components/layout/Layout'
// import AreaStats from '@/components/areas/AreaStats'

// Lazy load AreaCard component
const AreaCard = dynamic(() => import('@/components/areas/AreaCard'), {
  ssr: true,
})

interface Area {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  city: string
  image: string
  propertiesCount: number
  averagePrice: number
  currency: string
  slug: string
  coordinates: { lat: number; lng: number }
  highlights: string[]
  amenities: string[]
}

// Hardcoded areas
const HARDCODED_AREAS: Area[] = [
  {
    id: 'beachfront',
    name: 'Beachfront',
    nameEn: 'Beachfront',
    description: 'Элитный прибрежный район с прямым доступом к пляжу и роскошными видами на море.',
    descriptionEn: 'Premium beachfront location with direct beach access and stunning sea views.',
    city: 'Dubai',
    image: '/images/hero.jpg',
    propertiesCount: 0,
    averagePrice: 0,
    currency: 'AED',
    slug: 'beachfront',
    coordinates: { lat: 25.2048, lng: 55.2708 },
    highlights: ['Beach Access', 'Sea Views', 'Luxury Living'],
    amenities: ['Beach', 'Marina', 'Restaurants', 'Shopping'],
  },
  {
    id: 'downtown',
    name: 'Downtown',
    nameEn: 'Downtown',
    description: 'Сердце Дубая с небоскребами, роскошными апартаментами и всемирно известными достопримечательностями.',
    descriptionEn: 'The heart of Dubai with skyscrapers, luxury apartments, and world-famous landmarks.',
    city: 'Dubai',
    image: '/images/hero.jpg',
    propertiesCount: 0,
    averagePrice: 0,
    currency: 'AED',
    slug: 'downtown',
    coordinates: { lat: 25.1972, lng: 55.2744 },
    highlights: ['Burj Khalifa', 'Dubai Mall', 'Business Hub'],
    amenities: ['Shopping', 'Dining', 'Entertainment', 'Business'],
  },
  {
    id: 'dubai-hills',
    name: 'Dubai Hills',
    nameEn: 'Dubai Hills',
    description: 'Современный жилой комплекс с парками, гольф-полями и семейной атмосферой.',
    descriptionEn: 'Modern residential community with parks, golf courses, and family-friendly atmosphere.',
    city: 'Dubai',
    image: '/images/hero.jpg',
    propertiesCount: 0,
    averagePrice: 0,
    currency: 'AED',
    slug: 'dubai-hills',
    coordinates: { lat: 25.0900, lng: 55.2400 },
    highlights: ['Golf Course', 'Parks', 'Family Community'],
    amenities: ['Golf', 'Parks', 'Schools', 'Shopping'],
  },
  {
    id: 'marina-shores',
    name: 'Marina Shores',
    nameEn: 'Marina Shores',
    description: 'Престижный район с видом на марину, современной архитектурой и активным образом жизни.',
    descriptionEn: 'Prestigious area with marina views, modern architecture, and active lifestyle.',
    city: 'Dubai',
    image: '/images/hero.jpg',
    propertiesCount: 0,
    averagePrice: 0,
    currency: 'AED',
    slug: 'marina-shores',
    coordinates: { lat: 25.0789, lng: 55.1394 },
    highlights: ['Marina Views', 'Modern Design', 'Waterfront'],
    amenities: ['Marina', 'Beach', 'Restaurants', 'Fitness'],
  },
  {
    id: 'the-oasis',
    name: 'The Oasis',
    nameEn: 'The Oasis',
    description: 'Эксклюзивный жилой комплекс с зелеными зонами, виллами и спокойной атмосферой.',
    descriptionEn: 'Exclusive residential community with green spaces, villas, and tranquil atmosphere.',
    city: 'Dubai',
    image: '/images/hero.jpg',
    propertiesCount: 0,
    averagePrice: 0,
    currency: 'AED',
    slug: 'the-oasis',
    coordinates: { lat: 25.0657, lng: 55.1713 },
    highlights: ['Green Spaces', 'Villas', 'Tranquil'],
    amenities: ['Parks', 'Community Facilities', 'Security'],
  },
]

export default function Areas() {
  const { t, i18n } = useTranslation('areas')
  const currentLocale = i18n.language || 'en'
  const [areas, setAreas] = useState<Area[]>([])

  // Load areas from API and merge with hardcoded
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await fetch('/api/areas')
        const data = await response.json()
        
        // Transform API data to match Area interface
        const transformedAreas: Area[] = (data.areas || []).map((area: any) => ({
          id: area.id,
          name: area.name,
          nameEn: area.nameEn || area.name,
          description: area.description || '',
          descriptionEn: area.descriptionEn || area.description || '',
          city: area.city || 'Dubai',
          image: '/images/hero.jpg',
          propertiesCount: 0,
          averagePrice: 0,
          currency: 'AED',
          slug: area.slug,
          coordinates: { lat: 25.2048, lng: 55.2708 },
          highlights: [],
          amenities: [],
        }))
        
        // Merge hardcoded areas with API areas (hardcoded first, avoid duplicates)
        const allAreas = [
          ...HARDCODED_AREAS,
          ...transformedAreas.filter(area => 
            !HARDCODED_AREAS.some(hc => hc.id === area.id || hc.slug === area.slug)
          )
        ]
        
        setAreas(allAreas)
      } catch (error) {
        console.error('Error fetching areas:', error)
        // Use hardcoded areas if API fails
        setAreas(HARDCODED_AREAS)
      }
    }

    fetchAreas()
  }, [currentLocale])

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
        {areas.length > 0 && (
          <Script
            id="areas-ld-json"
            type="application/ld+json"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": t('title'),
                "description": t('description'),
                "numberOfItems": areas.length,
                "itemListElement": areas.slice(0, 10).map((area, index) => ({
                  "@type": "Place",
                  "position": index + 1,
                  "name": area.nameEn,
                  "description": area.descriptionEn,
                  "url": `/areas/${area.slug}`
                }))
              })
            }}
          />
        )}
      </Head>

      <Layout>
        <div className="bg-white">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-graphite to-gray-800 text-white">
            <div className="container-custom py-16">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  {t('title')}
                </h1>
                <p className="text-xl text-gray-200 mb-8">
                  {t('description')}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {areas.length} {t('areas')}
                  </div>
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {areas.reduce((sum, area) => sum + area.propertiesCount, 0)} {t('properties')}
                  </div>
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {t('premiumLocations')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Areas Grid */}
          <div className="container-custom py-16">
            {areas.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('noAreas') || 'No areas found'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {areas.map((area) => (
                  <AreaCard key={area.id} area={area} />
                ))}
              </div>
            )}
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'areas'])),
    },
  }
}
