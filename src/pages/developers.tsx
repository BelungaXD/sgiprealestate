import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import DeveloperCard from '@/components/developers/DeveloperCard'

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
  const { t, i18n } = useTranslation('developers')
  const currentLocale = i18n.language || 'en'
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)

  // Load developers from API
  useEffect(() => {
    const fetchDevelopers = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/developers')
        const data = await response.json()
        
        // Transform API data to match Developer interface
        const transformedDevelopers: Developer[] = (data.developers || []).map((dev: any) => ({
          id: dev.id,
          name: dev.name,
          nameEn: dev.nameEn || dev.name,
          description: dev.description || '',
          descriptionEn: dev.descriptionEn || dev.description || '',
          logo: dev.logo || '',
          founded: 0,
          headquarters: dev.city || 'Dubai, UAE',
          propertiesCount: dev.propertiesCount || 0,
          averagePrice: 0,
          currency: 'AED',
          slug: dev.slug,
          website: dev.website || '',
          specialties: [],
          notableProjects: [],
          awards: [],
          rating: 5,
          marketShare: 0,
          countries: ['UAE'],
        }))
        
        setDevelopers(transformedDevelopers)
      } catch (error) {
        console.error('Error fetching developers:', error)
        setDevelopers([])
      } finally {
        setLoading(false)
      }
    }

    fetchDevelopers()
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
        {developers.length > 0 && (
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
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": developer.headquarters
                }
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
            {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : developers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('noDevelopers') || 'No developers found'}</p>
              </div>
            ) : (
            <div className={`grid gap-8 ${
              developers.length === 1 
                ? 'grid-cols-1 max-w-2xl mx-auto' 
                : developers.length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {developers.map((developer) => (
                <DeveloperCard key={developer.id} developer={developer} />
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'developers'])),
    },
  }
}
