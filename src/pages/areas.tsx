import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import AreaCard from '@/components/areas/AreaCard'
// import AreaStats from '@/components/areas/AreaStats'

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

export default function Areas() {
  const { t } = useTranslation('areas')

  // Mock data - in real app this would come from API
  const areas: Area[] = [
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
      slug: 'downtown-dubai',
      coordinates: { lat: 25.1972, lng: 55.2744 },
      highlights: ['Burj Khalifa', 'Dubai Mall', 'Dubai Fountain', 'Business Bay'],
      amenities: ['Shopping', 'Dining', 'Entertainment', 'Business Centers', 'Metro Access']
    },
    {
      id: '2',
      name: 'Пальм Джумейра',
      nameEn: 'Palm Jumeirah',
      description: 'Искусственный остров в форме пальмы с эксклюзивными виллами и пляжными резиденциями.',
      descriptionEn: 'Artificial palm-shaped island with exclusive villas and beachfront residences.',
      city: 'Dubai',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      propertiesCount: 28,
      averagePrice: 8500000,
      currency: 'AED',
      slug: 'palm-jumeirah',
      coordinates: { lat: 25.1124, lng: 55.1390 },
      highlights: ['Atlantis Hotel', 'Beach Access', 'Marina Views', 'Luxury Resorts'],
      amenities: ['Beach', 'Marina', 'Resorts', 'Water Sports', 'Fine Dining']
    },
    {
      id: '3',
      name: 'Дубай Марина',
      nameEn: 'Dubai Marina',
      description: 'Современный район с небоскребами вдоль канала, популярный среди молодых профессионалов.',
      descriptionEn: 'Modern district with skyscrapers along the canal, popular among young professionals.',
      city: 'Dubai',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      propertiesCount: 67,
      averagePrice: 1800000,
      currency: 'AED',
      slug: 'dubai-marina',
      coordinates: { lat: 25.0764, lng: 55.1324 },
      highlights: ['Marina Walk', 'JBR Beach', 'Skyscrapers', 'Canal Views'],
      amenities: ['Marina', 'Beach', 'Shopping', 'Dining', 'Metro Access']
    },
    {
      id: '4',
      name: 'Арабские Ранчи',
      nameEn: 'Arabian Ranches',
      description: 'Семейный район с виллами и таунхаусами в стиле ранчо, идеальный для семей с детьми.',
      descriptionEn: 'Family-friendly district with ranch-style villas and townhouses, perfect for families with children.',
      city: 'Dubai',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      propertiesCount: 34,
      averagePrice: 2800000,
      currency: 'AED',
      slug: 'arabian-ranches',
      coordinates: { lat: 25.0331, lng: 55.2001 },
      highlights: ['Golf Course', 'Schools', 'Parks', 'Community Living'],
      amenities: ['Golf', 'Schools', 'Parks', 'Community Centers', 'Shopping']
    },
    {
      id: '5',
      name: 'ДИФК',
      nameEn: 'DIFC',
      description: 'Международный финансовый центр с офисными зданиями и роскошными апартаментами.',
      descriptionEn: 'International Financial Centre with office buildings and luxury apartments.',
      city: 'Dubai',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      propertiesCount: 23,
      averagePrice: 2200000,
      currency: 'AED',
      slug: 'difc',
      coordinates: { lat: 25.2138, lng: 55.2719 },
      highlights: ['Financial Hub', 'Office Towers', 'Luxury Apartments', 'Business District'],
      amenities: ['Offices', 'Banks', 'Restaurants', 'Metro Access', 'Business Services']
    },
    {
      id: '6',
      name: 'Джумейра Бич Резорт',
      nameEn: 'Jumeirah Beach Residence',
      description: 'Пляжный район с высококлассными апартаментами и прямой доступ к пляжу.',
      descriptionEn: 'Beachfront district with high-end apartments and direct beach access.',
      city: 'Dubai',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      propertiesCount: 41,
      averagePrice: 2400000,
      currency: 'AED',
      slug: 'jbr',
      coordinates: { lat: 25.0764, lng: 55.1324 },
      highlights: ['Beach Access', 'The Walk', 'Resorts', 'Water Sports'],
      amenities: ['Beach', 'Shopping', 'Dining', 'Entertainment', 'Water Sports']
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
              "numberOfItems": areas.length,
              "itemListElement": areas.map((area, index) => ({
                "@type": "Place",
                "position": index + 1,
                "name": area.nameEn,
                "description": area.descriptionEn,
                "url": `/areas/${area.slug}`,
                "image": area.image,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": area.city,
                  "addressCountry": "AE"
                },
                "geo": {
                  "@type": "GeoCoordinates",
                  "latitude": area.coordinates.lat,
                  "longitude": area.coordinates.lng
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {areas.map((area) => (
                <AreaCard key={area.id} area={area} />
              ))}
            </div>
          </div>

          {/* Area Statistics */}
          <div className="bg-gray-50 py-16">
            <div className="container-custom">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-graphite mb-4">Area Statistics</h2>
                <p className="text-lg text-gray-600">Total Areas: {areas.length}</p>
              </div>
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'areas'])),
    },
  }
}
