import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import PropertyFilter from '@/components/property/PropertyFilter'
import PropertyGrid from '@/components/property/PropertyGrid'
import PropertySort from '@/components/property/PropertySort'
import Pagination from '@/components/ui/Pagination'

interface Property {
  id: string
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
  const { t } = useTranslation('properties')
  const { locale } = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [filters, setFilters] = useState({
    type: '',
    district: '',
    developer: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    maxArea: '',
    yearBuilt: '',
    completionDate: ''
  })
  const [sortBy, setSortBy] = useState('price-asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // Mock data - in real app this would come from API
  const mockProperties: Property[] = [
    {
      id: '1',
      title: 'Luxury Penthouse in Downtown Dubai',
      description: 'Stunning penthouse with panoramic city views',
      price: 2500000,
      currency: 'AED',
      type: 'Penthouse',
      area: 2500,
      bedrooms: 3,
      bathrooms: 3,
      parking: 2,
      location: 'Downtown Dubai, UAE',
      district: 'Downtown',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      isFeatured: true,
      yearBuilt: 2023,
      completionDate: '2024-06-01',
      developer: 'Emaar Properties'
    },
    {
      id: '2',
      title: 'Modern Villa in Palm Jumeirah',
      description: 'Exclusive beachfront villa with private pool',
      price: 4500000,
      currency: 'AED',
      type: 'Villa',
      area: 4500,
      bedrooms: 5,
      bathrooms: 4,
      parking: 3,
      location: 'Palm Jumeirah, UAE',
      district: 'Palm Jumeirah',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      isFeatured: true,
      yearBuilt: 2022,
      completionDate: '2023-12-01',
      developer: 'Nakheel'
    },
    {
      id: '3',
      title: 'Elegant Apartment in Marina',
      description: 'Contemporary apartment with marina views',
      price: 1800000,
      currency: 'AED',
      type: 'Apartment',
      area: 1800,
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      location: 'Dubai Marina, UAE',
      district: 'Marina',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      isFeatured: false,
      yearBuilt: 2021,
      completionDate: '2022-03-01',
      developer: 'Damac Properties'
    },
    {
      id: '4',
      title: 'Luxury Townhouse in Arabian Ranches',
      description: 'Spacious townhouse in family-friendly community',
      price: 3200000,
      currency: 'AED',
      type: 'Townhouse',
      area: 3200,
      bedrooms: 4,
      bathrooms: 3,
      parking: 2,
      location: 'Arabian Ranches, UAE',
      district: 'Arabian Ranches',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      isFeatured: false,
      yearBuilt: 2020,
      completionDate: '2021-09-01',
      developer: 'Emaar Properties'
    },
    {
      id: '5',
      title: 'Premium Office Space in DIFC',
      description: 'Grade A office space in Dubai International Financial Centre',
      price: 1200000,
      currency: 'AED',
      type: 'Office',
      area: 1200,
      bedrooms: 0,
      bathrooms: 2,
      parking: 1,
      location: 'DIFC, UAE',
      district: 'DIFC',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      isFeatured: false,
      yearBuilt: 2023,
      completionDate: '2024-01-01',
      developer: 'Sobha Realty'
    },
    {
      id: '6',
      title: 'Studio Apartment in JBR',
      description: 'Modern studio with beach access',
      price: 800000,
      currency: 'AED',
      type: 'Studio',
      area: 800,
      bedrooms: 0,
      bathrooms: 1,
      parking: 0,
      location: 'JBR, UAE',
      district: 'JBR',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      isFeatured: false,
      yearBuilt: 2022,
      completionDate: '2023-05-01',
      developer: 'Meraas'
    },
    // UAE-only dataset (non-UAE entries removed)
    {
      id: '10',
      title: 'Luxury Apartment in Abu Dhabi Corniche',
      description: 'Premium apartment with stunning sea views',
      price: 3200000,
      currency: 'AED',
      type: 'Apartment',
      area: 2800,
      bedrooms: 3,
      bathrooms: 3,
      parking: 2,
      location: 'Corniche, Abu Dhabi, UAE',
      district: 'Corniche',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      isFeatured: false,
      yearBuilt: 2023,
      completionDate: '2024-02-01',
      developer: 'Aldar Properties'
    }
  ]

  useEffect(() => {
    // Simulate API call
    setLoading(true)
    setTimeout(() => {
      let data = mockProperties
      if (locale === 'ru') {
        data = mockProperties.map((p) => {
          const copy = { ...p }
          // Basic RU translations for demo content
          copy.title = copy.title
            .replace('Luxury Penthouse in Downtown Dubai', 'Роскошный пентхаус в Даунтауне Дубая')
            .replace('Modern Villa in Palm Jumeirah', 'Современная вилла на Пальм Джумейра')
            .replace('Elegant Apartment in Marina', 'Элегантные апартаменты в Марине')
            .replace('Premium Office Space in DIFC', 'Премиальные офисы в DIFC')
            .replace('Studio Apartment in JBR', 'Студия в JBR')
          copy.description = copy.description
            .replace('Stunning penthouse with panoramic city views', 'Потрясающий пентхаус с панорамными видами на город')
            .replace('Exclusive beachfront villa with private pool', 'Эксклюзивная вилла у моря с частным бассейном')
            .replace('Contemporary apartment with marina views', 'Современные апартаменты с видом на марину')
            .replace('Grade A office space in Dubai International Financial Centre', 'Офисные помещения класса A в международном финансовом центре Дубая')
            .replace('Modern studio with beach access', 'Современная студия с выходом на пляж')
          copy.location = copy.location
            .replace('Downtown Dubai, UAE', 'Даунтаун Дубай, ОАЭ')
            .replace('Palm Jumeirah, UAE', 'Пальм Джумейра, ОАЭ')
            .replace('Dubai Marina, UAE', 'Дубай Марина, ОАЭ')
            .replace('DIFC, UAE', 'DIFC, ОАЭ')
            .replace('JBR, UAE', 'JBR, ОАЭ')
          return copy
        })
      }
      setProperties(data)
      setFilteredProperties(data)
      setLoading(false)
    }, 1000)
  }, [locale])

  useEffect(() => {
    let filtered = [...properties]

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(prop => prop.type === filters.type)
    }
    if (filters.district) {
      filtered = filtered.filter(prop => prop.district === filters.district)
    }
    if (filters.developer) {
      filtered = filtered.filter(prop => prop.developer === filters.developer)
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
    if (filters.yearBuilt) {
      filtered = filtered.filter(prop => prop.yearBuilt >= parseInt(filters.yearBuilt))
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": t('title'),
              "description": t('description'),
              "numberOfItems": filteredProperties.length,
              "itemListElement": filteredProperties.map((property, index) => ({
                "@type": "RealEstateListing",
                "position": index + 1,
                "name": property.title,
                "description": property.description,
                "url": `/properties/${property.id}`,
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
                    {t('showing')} {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} {t('of')} {filteredProperties.length} {t('properties')}
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
