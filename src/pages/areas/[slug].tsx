import { GetStaticProps, GetStaticPaths } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import AreaHero from '@/components/areas/AreaHero'
import AreaOverview from '@/components/areas/AreaOverview'
import AreaProperties from '@/components/areas/AreaProperties'
import AreaAmenities from '@/components/areas/AreaAmenities'
import AreaMap from '@/components/areas/AreaMap'
import RelatedAreas from '@/components/areas/RelatedAreas'

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
  detailedDescription: string
  detailedDescriptionEn: string
  marketInsights: {
    priceGrowth: number
    rentalYield: number
    demandLevel: string
    investmentRating: number
  }
  transportation: Array<{
    type: string
    name: string
    distance: string
    icon: string
  }>
  schools: Array<{
    name: string
    type: string
    rating: number
    distance: string
  }>
  healthcare: Array<{
    name: string
    type: string
    distance: string
  }>
}

interface AreaDetailProps {
  area: Area
}

export default function AreaDetail({ area }: AreaDetailProps) {
  const { t, i18n } = useTranslation('areas')
  const isRussian = i18n.language === 'ru'

  const displayName = isRussian ? area.name : area.nameEn
  const displayDescription = isRussian ? area.description : area.descriptionEn
  const displayDetailedDescription = isRussian ? area.detailedDescription : area.detailedDescriptionEn

  return (
    <>
      <Head>
        <title>{displayName} | SGIP Real Estate</title>
        <meta name="description" content={displayDescription} />
        <meta property="og:title" content={displayName} />
        <meta property="og:description" content={displayDescription} />
        <meta property="og:image" content={area.image} />
        <meta property="og:type" content="website" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Place",
              "name": displayName,
              "description": displayDescription,
              "image": area.image,
              "url": `/areas/${area.slug}`,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": area.city,
                "addressCountry": "AE"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": area.coordinates.lat,
                "longitude": area.coordinates.lng
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": area.marketInsights.investmentRating,
                "ratingCount": area.propertiesCount
              }
            })
          }}
        />
      </Head>

      <Layout>
        <div className="bg-white">
          {/* Area Hero Section */}
          <AreaHero area={area} />

          {/* Area Overview */}
          <div className="container-custom py-16">
            <AreaOverview 
              area={area}
            />
          </div>

          {/* Area Properties */}
          <div className="bg-gray-50 py-16">
            <div className="container-custom">
              <AreaProperties properties={[]} areaName={displayName} />
            </div>
          </div>

          {/* Area Amenities */}
          <div className="container-custom py-16">
            <AreaAmenities amenities={area.amenities} highlights={area.highlights} />
          </div>

          {/* Area Map */}
          <div className="bg-gray-50 py-16">
            <div className="container-custom">
              <AreaMap coordinates={area.coordinates} name={displayName} />
            </div>
          </div>

          {/* Related Areas */}
          <div className="container-custom py-16">
            <RelatedAreas currentAreaId={area.id} city={area.city} />
          </div>
        </div>
      </Layout>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const areas = [
    { slug: 'downtown-dubai' },
    { slug: 'palm-jumeirah' },
    { slug: 'dubai-marina' },
    { slug: 'arabian-ranches' },
    { slug: 'difc' },
    { slug: 'jbr' },
  ]

  const paths = areas.flatMap((area) =>
    (locales || ['en']).map((locale) => ({
      params: { slug: area.slug },
      locale,
    }))
  )

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  // Fetch from API - no mock data
  // Return empty area for now - should be fetched from API
  const mockArea: Area | null = null
  /* Removed mock data - fetch from API:
  {
    id: '1',
    name: 'Даунтаун Дубай',
    nameEn: 'Downtown Dubai',
    description: 'Сердце современного Дубая с небоскребами, торговыми центрами и роскошными резиденциями.',
    descriptionEn: 'The heart of modern Dubai with skyscrapers, shopping centers, and luxury residences.',
    city: 'Dubai',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    propertiesCount: 45,
    averagePrice: 3200000,
    currency: 'AED',
    slug: params?.slug as string,
    coordinates: { lat: 25.1972, lng: 55.2744 },
    highlights: ['Burj Khalifa', 'Dubai Mall', 'Dubai Fountain', 'Business Bay'],
    amenities: ['Shopping', 'Dining', 'Entertainment', 'Business Centers', 'Metro Access'],
    detailedDescription: 'Даунтаун Дубай - это эпицентр современной жизни в ОАЭ. Этот район представляет собой уникальное сочетание роскошных резиденций, мирового класса торговых центров, ресторанов и развлекательных заведений. Здесь находится самое высокое здание в мире - Бурдж-Халифа, а также крупнейший торговый центр - Дубай Молл.',
    detailedDescriptionEn: 'Downtown Dubai is the epicenter of modern life in the UAE. This district represents a unique combination of luxury residences, world-class shopping centers, restaurants, and entertainment venues. It is home to the world\'s tallest building - Burj Khalifa, as well as the largest shopping mall - Dubai Mall.',
    marketInsights: {
      priceGrowth: 8.5,
      rentalYield: 6.2,
      demandLevel: 'High',
      investmentRating: 4.8
    },
    transportation: [
      { type: 'Metro', name: 'Burj Khalifa/Dubai Mall Station', distance: '2 min walk', icon: '🚇' },
      { type: 'Bus', name: 'Downtown Bus Stop', distance: '1 min walk', icon: '🚌' },
      { type: 'Taxi', name: 'Taxi Stand', distance: 'Available 24/7', icon: '🚕' }
    ],
    schools: [
      { name: 'Dubai International Academy', type: 'International School', rating: 4.5, distance: '10 min drive' },
      { name: 'American University of Dubai', type: 'University', rating: 4.2, distance: '15 min drive' }
    ],
    healthcare: [
      { name: 'Dubai Hospital', type: 'General Hospital', distance: '8 min drive' },
      { name: 'Mediclinic City Hospital', type: 'Private Hospital', distance: '12 min drive' }
    ]
  }
  */

  return {
    props: {
      area: mockArea,
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'areas'])),
    },
    notFound: mockArea === null, // Return 404 if no data
  }
}
