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
  const { t, i18n } = useTranslation('areas')
  const currentLocale = i18n.language || 'en'

  // Load areas from API - no mock data
  const areas: Area[] = []

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
          <script
            type="application/ld+json"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {areas.map((area) => (
                <AreaCard key={area.id} area={area} />
              ))}
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
