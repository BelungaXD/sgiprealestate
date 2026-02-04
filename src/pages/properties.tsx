import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Layout from '@/components/layout/Layout'
import PropertyFilter from '@/components/property/PropertyFilter'
import PropertySort from '@/components/property/PropertySort'
import Pagination from '@/components/ui/Pagination'

// Lazy load heavy components
const PropertyGrid = dynamic(() => import('@/components/property/PropertyGrid'), {
  ssr: true,
  loading: () => <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"><div className="h-64 bg-gray-200 rounded-lg animate-pulse" /></div>,
})

interface Property {
  id: string
  slug: string
  title: string
  description: string
  price: number
  currency: string
  type: string
  area: number
  bedrooms: number
  bathrooms: number
  parking: number
  location: string
  district: string
  image: string
  isFeatured: boolean
  yearBuilt: number
  completionDate: string
  developer: string
}

export default function Properties() {
  const { t, i18n } = useTranslation('properties')
  const router = useRouter()
  const locale = router.locale || 'en'
  const currentLocale = i18n.language || locale
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [filters, setFilters] = useState({
    type: '',
    area: [] as string[],
    developer: [] as string[],
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
    minYearBuilt: '',
    maxYearBuilt: '',
    completionDate: ''
  })
  const [sortBy, setSortBy] = useState('price-asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Check URL parameters for developer and area filters
  useEffect(() => {
    const developerParam = router.query.developer as string
    const areaParam = router.query.area as string
    if (developerParam) {
      setFilters(prev => ({
        ...prev,
        developer: [decodeURIComponent(developerParam)],
      }))
    }
    if (areaParam) {
      setFilters(prev => ({
        ...prev,
        area: [decodeURIComponent(areaParam)],
      }))
    }
  }, [router.query])

  // Load properties from API
  useEffect(() => {
    const fetchProperties = async () => {
    setLoading(true)
      try {
        const response = await fetch('/api/properties?limit=100')
        const data = await response.json()
        
        // Transform API data to match Property interface
        const transformedProperties: Property[] = data.properties
          .filter((p: any) => p.isPublished) // Only show published properties
          .map((p: any) => ({
            id: p.id,
            slug: p.slug || p.id,
            title: p.title,
            description: p.description || '',
            price: p.price,
            currency: p.currency,
            type: p.type,
            area: p.areaSqm,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            parking: p.parking || 0,
            location: p.city,
            district: p.district,
            image: p.images && p.images.length > 0 ? p.images[0].url : '/images/hero.jpg',
            isFeatured: p.isFeatured,
            yearBuilt: p.yearBuilt || 0,
            completionDate: p.completionDate || '',
            developer: p.developer?.name || p.developer?.nameEn || '',
          }))
        
        setProperties(transformedProperties)
        setFilteredProperties(transformedProperties)
      } catch (error) {
        console.error('Error fetching properties:', error)
        setProperties([])
        setFilteredProperties([])
      } finally {
      setLoading(false)
      }
    }

    fetchProperties()
  }, [currentLocale])

  useEffect(() => {
    let filtered = [...properties]

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(prop => prop.type === filters.type)
    }
    if (filters.area && filters.area.length > 0) {
      filtered = filtered.filter(prop => filters.area.includes(prop.district))
    }
    if (filters.developer && filters.developer.length > 0) {
      filtered = filtered.filter(prop => {
        const propDeveloper = prop.developer?.trim() || ''
        return filters.developer.some(filterDeveloper => {
          const trimmedFilter = filterDeveloper.trim()
          return propDeveloper === trimmedFilter || 
                 propDeveloper.toLowerCase() === trimmedFilter.toLowerCase()
        })
      })
    }
    if (filters.minPrice) {
      filtered = filtered.filter(prop => prop.price >= parseInt(filters.minPrice))
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(prop => prop.price <= parseInt(filters.maxPrice))
    }
    if (filters.bedrooms) {
      filtered = filtered.filter(prop => prop.bedrooms >= parseInt(filters.bedrooms))
    }
    if (filters.bathrooms) {
      filtered = filtered.filter(prop => prop.bathrooms >= parseInt(filters.bathrooms))
    }
    if (filters.minArea) {
      filtered = filtered.filter(prop => prop.area >= parseInt(filters.minArea))
    }
    if (filters.maxArea) {
      filtered = filtered.filter(prop => prop.area <= parseInt(filters.maxArea))
    }
    if (filters.minYearBuilt) {
      filtered = filtered.filter(prop => prop.yearBuilt >= parseInt(filters.minYearBuilt))
    }
    if (filters.maxYearBuilt) {
      filtered = filtered.filter(prop => prop.yearBuilt <= parseInt(filters.maxYearBuilt))
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'area-asc':
        filtered.sort((a, b) => a.area - b.area)
        break
      case 'area-desc':
        filtered.sort((a, b) => b.area - a.area)
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.completionDate).getTime() - new Date(b.completionDate).getTime())
        break
    }

    setFilteredProperties(filtered)
    setCurrentPage(1)
  }, [filters, sortBy, properties])

  const itemsPerPage = 9
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProperties = filteredProperties.slice(startIndex, endIndex)

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
        <meta property="og:title" content={t('title')} />
        <meta property="og:description" content={t('description')} />
        <meta property="og:type" content="website" />
        {filteredProperties.length > 0 && (
          <Script
            id="properties-ld-json"
            type="application/ld+json"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": t('title'),
                "description": t('description'),
                "numberOfItems": filteredProperties.length,
                "itemListElement": filteredProperties.slice(0, 10).map((property, index) => ({
                  "@type": "RealEstateListing",
                  "position": index + 1,
                  "name": property.title,
                  "description": property.description,
                  "url": `/properties/${property.slug}`,
                  "image": property.image,
                  "offers": {
                  "@type": "Offer",
                  "price": property.price,
                  "priceCurrency": property.currency
                },
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": property.location
                },
                "floorSize": {
                  "@type": "QuantitativeValue",
                  "value": property.area,
                  "unitCode": "SQM"
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
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  {t('title')}
                </h1>
                <p className="text-xl text-gray-200 mb-8">
                  {t('description')}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {properties.length} {t('properties')}
                  </div>
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {properties.filter(p => p.isFeatured).length} {t('featured', 'Featured')}
                  </div>
                  <div className="bg-white/10 rounded-full px-4 py-2">
                    {new Set(properties.map(p => p.district)).size} {t('districts', 'Districts')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container-custom py-16">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <div className="lg:w-1/4">
                <PropertyFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  properties={properties}
                />
              </div>

              {/* Properties Grid */}
              <div className="lg:w-3/4">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    {filteredProperties.length === 0 
                      ? `${t('showing')} 0 ${t('of')} 0 ${t('properties')}`
                      : `${t('showing')} ${startIndex + 1}-${Math.min(endIndex, filteredProperties.length)} ${t('of')} ${filteredProperties.length} ${t('properties')}`
                    }
                  </div>
                  <PropertySort sortBy={sortBy} onSortChange={setSortBy} />
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="card animate-pulse">
                        <div className="h-64 bg-gray-200 rounded-t-lg"></div>
                        <div className="p-6">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                          <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : currentProperties.length > 0 ? (
                  <>
                    <PropertyGrid properties={currentProperties} />
                    {totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('noProperties')}
                    </h3>
                    <p className="text-gray-500">
                      {t('noPropertiesDescription')}
                    </p>
                  </div>
                )}
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'properties'])),
    },
  }
}
