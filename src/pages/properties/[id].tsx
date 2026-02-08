import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useState, useRef } from 'react'
import Layout from '@/components/layout/Layout'
import PropertyGallery from '@/components/property/PropertyGallery'
import PropertyDetails from '@/components/property/PropertyDetails'
import PropertyContactForm from '@/components/property/PropertyContactForm'
import PropertyFiles from '@/components/property/PropertyFiles'
import RelatedProperties from '@/components/property/RelatedProperties'
import { prisma } from '@/lib/prisma'
import { normalizeUploadUrl } from '@/lib/utils/imageUrl'
import { 
  MapPinIcon, 
  HomeIcon, 
  WrenchScrewdriverIcon, 
  Square3Stack3DIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShareIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

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
  images: string[]
  floorPlans: Array<{
    id: string
    title: string
    area: number
    bedrooms: number
    bathrooms: number
    url: string
  }>
  features: string[]
  amenities: string[]
  yearBuilt: number
  completionDate: string
  developer: string
  developerLogo: string
  isFeatured: boolean
  coordinates: { lat: number; lng: number }
  infrastructure: Array<{
    category: string
    items: Array<{
      name: string
      distance: string
      type: string
    }>
  }>
  files: Array<{
    id: string
    label: string
    url: string
    filename: string
    size?: number | null
    mimeType?: string | null
  }>
}

interface PropertyDetailProps {
  property: Property
}

export default function PropertyDetail({ property }: PropertyDetailProps) {
  const { t } = useTranslation('property')
  const [activeTab, setActiveTab] = useState('overview')
  const [isSaved, setIsSaved] = useState(false)
  const tabsSectionRef = useRef<HTMLDivElement>(null)

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      // You could show a toast notification here
    }
  }

  const handleOpenContactTab = () => {
    setActiveTab('contact')
    // Scroll to tabs section smoothly
    setTimeout(() => {
      tabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const tabs = [
    { id: 'overview', label: t('tabs.overview') },
    { id: 'files', label: t('tabs.files', 'Documents') },
    { id: 'contact', label: t('tabs.contact') },
  ]

  return (
    <>
      <Head>
        <title>{property.title} | SGIP Real Estate</title>
        <meta name="description" content={property.description} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgipreal.com'}/properties/${property.slug}`} />
        <meta property="og:title" content={property.title} />
        <meta property="og:description" content={property.description} />
        <meta property="og:image" content={property.images[0]} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgipreal.com'}/properties/${property.slug}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateListing",
              "name": property.title,
              "description": property.description,
              "image": property.images,
              "url": `/properties/${property.slug}`,
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
              },
              "numberOfRooms": property.bedrooms,
              "numberOfBathroomsTotal": property.bathrooms
            })
          }}
        />
      </Head>

      <Layout>
        <div className="bg-gray-50 min-h-screen">
          {/* Property Header - White Background */}
          <div className="bg-white border-b border-gray-200">
            <div className="container-custom py-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="bg-champagne text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                  {property.type}
                </span>
                {property.isFeatured && (
                  <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                    {t('featured')}
                  </span>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-3">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold text-graphite mb-2">
                    {property.title}
                  </h1>
                </div>
                <div className="bg-white rounded-xl border-2 border-champagne shadow-lg p-5 md:p-6 min-w-[260px] transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-champagne-dark group cursor-pointer">
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="text-3xl md:text-4xl font-bold text-champagne transition-colors duration-300 group-hover:text-champagne-dark">
                      {formatPrice(property.price, property.currency)}
                    </div>
                  </div>
                  {property.area > 0 && (
                    <div className="text-sm text-gray-600 border-t border-gray-100 pt-2 transition-all duration-300 group-hover:border-champagne/30">
                      <span className="font-medium">{t('pricePerSqft')}:</span>{' '}
                      <span className="text-champagne font-semibold transition-colors duration-300 group-hover:text-champagne-dark">{formatPrice(property.price / property.area, property.currency)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPinIcon className="h-6 w-6 mr-2 text-champagne" />
                <span className="text-xl font-medium">{property.location}</span>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="relative w-full bg-white">
            <PropertyGallery images={property.images} />
          </div>

          {/* Main Content Area */}
          <div className="container-custom mt-8 relative z-20 pb-8">
            <div className="max-w-5xl mx-auto">
              {/* Main Content */}
              <div className="space-y-8">
                {/* Quick Stats Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center transition-transform duration-300 group-hover:scale-105">
                      <div className="w-14 h-14 bg-champagne/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-champagne/20 group-hover:scale-110">
                        <HomeIcon className="h-7 w-7 text-champagne transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="text-2xl font-bold text-graphite mb-1">{property.bedrooms}</div>
                      <div className="text-sm text-gray-600">{t('bedrooms')}</div>
                    </div>
                    <div className="text-center transition-transform duration-300 group-hover:scale-105">
                      <div className="w-14 h-14 bg-champagne/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-champagne/20 group-hover:scale-110">
                        <WrenchScrewdriverIcon className="h-7 w-7 text-champagne transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="text-2xl font-bold text-graphite mb-1">{property.bathrooms}</div>
                      <div className="text-sm text-gray-600">{t('bathrooms')}</div>
                    </div>
                    <div className="text-center transition-transform duration-300 group-hover:scale-105">
                      <div className="w-14 h-14 bg-champagne/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-champagne/20 group-hover:scale-110">
                        <Square3Stack3DIcon className="h-7 w-7 text-champagne transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="text-2xl font-bold text-graphite mb-1">{property.area.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">sq ft</div>
                    </div>
                    <div className="text-center transition-transform duration-300 group-hover:scale-105">
                      <div className="w-14 h-14 bg-champagne/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-champagne/20 group-hover:scale-110">
                        <CalendarIcon className="h-7 w-7 text-champagne transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="text-2xl font-bold text-graphite mb-1">{property.yearBuilt}</div>
                      <div className="text-sm text-gray-600">{t('yearBuilt')}</div>
                    </div>
                  </div>
                </div>

                {/* Property Tabs */}
                <div ref={tabsSectionRef} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                  <div className="border-b border-gray-200 bg-gray-50/50">
                    <nav className="flex space-x-1 p-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-500 ease-in-out ${
                            activeTab === tab.id
                              ? 'bg-champagne-dark text-white shadow-md'
                              : 'bg-white text-champagne border-2 border-champagne hover:bg-champagne-dark hover:text-white hover:border-champagne-dark'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className="p-8 min-h-[400px]">
                    {activeTab === 'overview' && (
                      <PropertyDetails property={property} />
                    )}
                    {activeTab === 'files' && (
                      <PropertyFiles files={property.files} />
                    )}
                    {activeTab === 'contact' && (
                      <PropertyContactForm property={property} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Properties */}
          <div className="bg-white py-16 mt-16">
            <div className="container-custom">
              <RelatedProperties 
                currentPropertyId={property.id}
                district={property.district}
                type={property.type}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  try {
    const id = params?.id as string

    if (!id) {
      console.log('[getServerSideProps] No ID provided')
      return {
        notFound: true,
      }
    }

    console.log('[getServerSideProps] Looking for property with ID/slug:', id)
    console.log('[getServerSideProps] DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'NOT configured')

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.log('[getServerSideProps] DATABASE_URL not configured')
      return {
        notFound: true,
      }
    }

    console.log('[getServerSideProps] Attempting to query database...')
    
    // Fetch property directly from database
    // Try to find by ID first, then by slug
    let apiProperty
    try {
      apiProperty = await prisma.property.findUnique({
        where: { id },
        include: {
          area: true,
          developer: true,
          images: {
            orderBy: { order: 'asc' },
          },
          floorPlans: {
            orderBy: { order: 'asc' },
          },
          files: {
            orderBy: { order: 'asc' },
          },
        },
      })
      console.log('[getServerSideProps] Query by ID result:', apiProperty ? 'found' : 'not found')
    } catch (error: any) {
      console.error('[getServerSideProps] Error querying by ID:', error.message)
      apiProperty = null
    }

    // If not found by ID, try to find by slug
    if (!apiProperty) {
      console.log('[getServerSideProps] Not found by ID, trying slug:', id)
      try {
        apiProperty = await prisma.property.findUnique({
          where: { slug: id },
          include: {
            area: true,
            developer: true,
            images: {
              orderBy: { order: 'asc' },
            },
            floorPlans: {
              orderBy: { order: 'asc' },
            },
            files: {
              orderBy: { order: 'asc' },
            },
          },
        })
        console.log('[getServerSideProps] Query by slug result:', apiProperty ? 'found' : 'not found')
      } catch (error: any) {
        console.error('[getServerSideProps] Error querying by slug:', error.message)
        apiProperty = null
      }
    }

    if (!apiProperty) {
      console.log('[getServerSideProps] Property not found:', id)
      // Try direct query to debug
      try {
        const directQuery = await prisma.property.findMany({
          where: { slug: { contains: id } },
          select: { id: true, slug: true, title: true, isPublished: true },
          take: 5
        })
        console.log('[getServerSideProps] Direct query results:', directQuery)
      } catch (debugError: any) {
        console.error('[getServerSideProps] Debug query error:', debugError.message)
      }
      return {
        notFound: true,
      }
    }

    if (!apiProperty.isPublished) {
      console.log('[getServerSideProps] Property not published:', id)
      return {
        notFound: true,
      }
    }

    console.log('[getServerSideProps] Property found:', apiProperty.title, 'Published:', apiProperty.isPublished, 'Images:', apiProperty.images?.length || 0)

    // Transform API data to match Property interface
    // Normalize upload URLs for standalone mode (/api/uploads/...)
    // Redirect to canonical slug URL when user visits with CUID (SEO, human-readable URLs)
    if (params?.id === apiProperty.id) {
      return {
        redirect: {
          destination: `/properties/${apiProperty.slug}`,
          permanent: true,
        },
      }
    }

    const property: Property = {
      id: apiProperty.id,
      slug: apiProperty.slug,
      title: apiProperty.title,
      description: apiProperty.description || '',
      price: apiProperty.price,
      currency: apiProperty.currency,
      type: apiProperty.type,
      area: apiProperty.areaSqm,
      bedrooms: apiProperty.bedrooms,
      bathrooms: apiProperty.bathrooms,
      parking: apiProperty.parking || 0,
      location: apiProperty.address
        ? `${apiProperty.address}, ${apiProperty.city}`
        : `${apiProperty.city}, ${apiProperty.district}`,
      district: apiProperty.district,
      images: apiProperty.images?.map((img: any) => normalizeUploadUrl(img.url)) || [],
      floorPlans: apiProperty.floorPlans?.map((fp: any) => ({
        id: fp.id,
        title: fp.title || 'Floor Plan',
        area: fp.area || 0,
        bedrooms: fp.bedrooms || 0,
        bathrooms: fp.bathrooms || 0,
        url: normalizeUploadUrl(fp.url),
      })) || [],
      features: apiProperty.features || [],
      amenities: apiProperty.amenities || [],
      yearBuilt: apiProperty.yearBuilt || 0,
      completionDate: apiProperty.completionDate || '',
      developer: apiProperty.developer?.name || '',
      developerLogo: normalizeUploadUrl(apiProperty.developer?.logo) || '',
      isFeatured: apiProperty.isFeatured || false,
      coordinates: apiProperty.coordinates || { lat: 0, lng: 0 },
      infrastructure: [], // Can be added later if needed
      files: apiProperty.files
        ?.filter((file: any) => {
          // Filter out videos and .DS_Store files, only show downloadable documents
          const isVideo = file.mimeType?.startsWith('video/')
          const isDSStore = file.filename?.includes('.DS_Store') || file.url?.includes('.DS_Store')
          return !isVideo && !isDSStore && file.label && file.label.trim() !== ''
        })
        .map((file: any) => ({
          id: file.id,
          label: file.label,
          url: normalizeUploadUrl(file.url),
          filename: file.filename,
          size: file.size,
          mimeType: file.mimeType,
        })) || [],
    }

  return {
    props: {
        property,
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'property'])),
    },
    }
  } catch (error) {
    console.error('Error fetching property:', error)
    return {
      notFound: true,
    }
  }
}
