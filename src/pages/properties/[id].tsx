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
        <meta property="og:title" content={property.title} />
        <meta property="og:description" content={property.description} />
        <meta property="og:image" content={property.images[0]} />
        <meta property="og:type" content="website" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateListing",
              "name": property.title,
              "description": property.description,
              "image": property.images,
              "url": `/properties/${property.id}`,
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
        <div className="bg-white">
          {/* Property Header */}
          <div className="container-custom py-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <span className="bg-champagne/10 text-champagne px-2 py-1 rounded-full font-medium">
                    {property.type}
                  </span>
                  {property.isFeatured && (
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                      {t('featured')}
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-graphite mb-4">
                  {property.title}
                </h1>
                
                <div className="flex items-center text-gray-600 mb-6">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  <span className="text-lg">{property.location}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <HomeIcon className="h-4 w-4 mr-1" />
                    <span>{property.bedrooms} {t('bedrooms')}</span>
                  </div>
                  <div className="flex items-center">
                    <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                    <span>{property.bathrooms} {t('bathrooms')}</span>
                  </div>
                  <div className="flex items-center">
                    <Square3Stack3DIcon className="h-4 w-4 mr-1" />
                    <span>{property.area.toLocaleString()} sq ft</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>{property.yearBuilt}</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-80">
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-3xl font-bold text-champagne mb-2">
                    {formatPrice(property.price, property.currency)}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {t('pricePerSqft')}: {formatPrice(property.price / property.area, property.currency)}
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={handleOpenContactTab}
                      className="w-full btn-primary"
                    >
                      {t('requestInfo')}
                    </button>
                    <button 
                      onClick={handleOpenContactTab}
                      className="w-full btn-secondary"
                    >
                      {t('scheduleViewing')}
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsSaved(!isSaved)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg border transition-colors ${
                          isSaved
                            ? 'bg-red-50 border-red-200 text-red-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:border-red-300'
                        }`}
                      >
                        <HeartIcon className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                        <span>{isSaved ? t('saved') : t('save')}</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:border-champagne hover:text-champagne transition-colors"
                      >
                        <ShareIcon className="h-4 w-4" />
                        <span>{t('share')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Gallery */}
          <PropertyGallery images={property.images} />

          {/* Property Tabs */}
          <div ref={tabsSectionRef} className="container-custom py-8">
            <div className="border-b border-gray-200 mb-8">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-champagne text-champagne'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
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

          {/* Related Properties */}
          <div className="bg-gray-50 py-16">
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
      return {
        notFound: true,
      }
    }

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return {
        notFound: true,
      }
    }

    // Fetch property directly from database
    // Try to find by ID first, then by slug
    let apiProperty = await prisma.property.findUnique({
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

    // If not found by ID, try to find by slug
    if (!apiProperty) {
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
    }

    if (!apiProperty || !apiProperty.isPublished) {
      return {
        notFound: true,
      }
    }

    // Transform API data to match Property interface
    // Normalize upload URLs for standalone mode (/api/uploads/...)
    const property: Property = {
      id: apiProperty.id,
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
