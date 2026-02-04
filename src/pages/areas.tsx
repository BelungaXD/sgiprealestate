import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Layout from '@/components/layout/Layout'
import AreaFilter from '@/components/areas/AreaFilter'
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

// Hardcoded areas - empty array
const HARDCODED_AREAS: Area[] = []

export default function Areas() {
  const { t, i18n } = useTranslation('areas')
  const currentLocale = i18n.language || 'en'
  const [areas, setAreas] = useState<Area[]>([])
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([])
  const [filters, setFilters] = useState({
    developer: [] as string[],
    location: [] as string[],
    city: '',
  })

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
        setFilteredAreas(allAreas)
      } catch (error) {
        console.error('Error fetching areas:', error)
        // Set empty array if API fails
        setAreas([])
        setFilteredAreas([])
      }
    }

    fetchAreas()
  }, [currentLocale])

  // Apply filters
  useEffect(() => {
    let filtered = [...areas]

    // Filter by developer (if area has developer property or we need to check properties in area)
    if (filters.developer) {
      // Note: This would require checking properties in each area
      // For now, we'll skip this filter if areas don't have developer info
      // filtered = filtered.filter(area => area.developer === filters.developer)
    }

    // Filter by location (North/South/East/West/Central based on coordinates) - Multiple selection
    if (filters.location && filters.location.length > 0) {
      filtered = filtered.filter(area => {
        const { lat, lng } = area.coordinates
        // Dubai center approximately: 25.2048, 55.2708
        const dubaiCenterLat = 25.2048
        const dubaiCenterLng = 55.2708
        
        return filters.location.some(loc => {
          switch (loc) {
            case 'north':
              return lat > dubaiCenterLat
            case 'south':
              return lat < dubaiCenterLat
            case 'east':
              return lng > dubaiCenterLng
            case 'west':
              return lng < dubaiCenterLng
            case 'central':
              return Math.abs(lat - dubaiCenterLat) < 0.1 && Math.abs(lng - dubaiCenterLng) < 0.1
            default:
              return false
          }
        })
      })
    }

    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(area => area.city === filters.city)
    }

    setFilteredAreas(filtered)
  }, [areas, filters])

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
        {filteredAreas.length > 0 && (
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
                "numberOfItems": filteredAreas.length,
                "itemListElement": filteredAreas.slice(0, 10).map((area, index) => ({
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
                    {filteredAreas.length} {t('areas')}
                  </div>
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {filteredAreas.reduce((sum, area) => sum + area.propertiesCount, 0)} {t('properties')}
                  </div>
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {t('premiumLocations')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Areas Grid with Filters */}
          <div className="container-custom py-16">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <AreaFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  areas={areas}
                />
              </div>

              {/* Areas Grid */}
              <div className="lg:col-span-3">
                {filteredAreas.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{t('noAreas') || 'No areas found'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredAreas.map((area) => (
                      <AreaCard key={area.id} area={area} />
                    ))}
                  </div>
                )}
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'areas', 'downtown', 'the-oasis'])),
    },
  }
}
