import { GetStaticProps, GetStaticPaths } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import PropertyGallery from '@/components/property/PropertyGallery'
import PropertyDetails from '@/components/property/PropertyDetails'
import PropertyFloorPlans from '@/components/property/PropertyFloorPlans'
import PropertyInfrastructure from '@/components/property/PropertyInfrastructure'
import PropertyContactForm from '@/components/property/PropertyContactForm'
import RelatedProperties from '@/components/property/RelatedProperties'
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
}

interface PropertyDetailProps {
  property: Property
}

export default function PropertyDetail({ property }: PropertyDetailProps) {
  const { t } = useTranslation('property')
  const [activeTab, setActiveTab] = useState('overview')
  const [isSaved, setIsSaved] = useState(false)

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

  const tabs = [
    { id: 'overview', label: t('tabs.overview') },
    { id: 'floorplans', label: t('tabs.floorPlans') },
    { id: 'infrastructure', label: t('tabs.infrastructure') },
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
                    <button className="w-full btn-primary">
                      {t('requestInfo')}
                    </button>
                    <button className="w-full btn-secondary">
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
          <div className="container-custom py-8">
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
              {activeTab === 'floorplans' && (
                <PropertyFloorPlans floorPlans={property.floorPlans} />
              )}
              {activeTab === 'infrastructure' && (
                <PropertyInfrastructure infrastructure={property.infrastructure} />
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

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  // In a real app, this would fetch from your API
  const properties = [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
  ]

  const paths = properties.flatMap((property) =>
    (locales || ['en']).map((locale) => ({
      params: { id: property.id },
      locale,
    }))
  )

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  // In a real app, this would fetch from your API
  const mockProperty: Property = {
    id: params?.id as string,
    title: 'Luxury Penthouse in Downtown Dubai',
    description: 'Stunning penthouse with panoramic city views, featuring modern design and premium finishes throughout. This exceptional property offers the perfect blend of luxury and comfort in the heart of Dubai.',
    price: 2500000,
    currency: 'AED',
    type: 'Penthouse',
    area: 2500,
    bedrooms: 3,
    bathrooms: 3,
    parking: 2,
    location: 'Downtown Dubai, UAE',
    district: 'Downtown',
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    ],
    floorPlans: [
      {
        id: '1',
        title: '3 Bedroom Layout',
        area: 2500,
        bedrooms: 3,
        bathrooms: 3,
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      }
    ],
    features: ['City Views', 'Private Elevator', 'Marble Floors', 'Smart Home System', 'Balcony', 'Walk-in Closet'],
    amenities: ['Swimming Pool', 'Gym', 'Concierge', 'Parking', 'Security', 'Garden'],
    yearBuilt: 2023,
    completionDate: '2024-06-01',
    developer: 'Emaar Properties',
    developerLogo: '/images/developers/emaar.png',
    isFeatured: true,
    coordinates: { lat: 25.1972, lng: 55.2744 },
    infrastructure: [
      {
        category: 'Shopping',
        items: [
          { name: 'Dubai Mall', distance: '5 min', type: 'Shopping Center' },
          { name: 'Souk Al Bahar', distance: '3 min', type: 'Souk' }
        ]
      },
      {
        category: 'Education',
        items: [
          { name: 'Dubai International Academy', distance: '10 min', type: 'School' },
          { name: 'American University of Dubai', distance: '15 min', type: 'University' }
        ]
      }
    ]
  }

  return {
    props: {
      property: mockProperty,
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'property'])),
    },
  }
}
