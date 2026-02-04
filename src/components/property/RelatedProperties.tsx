import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { MapPinIcon, HomeIcon, WrenchScrewdriverIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline'

interface Property {
  id: string
  slug?: string
  title: string
  price: number
  currency: string
  type: string
  area: number
  bedrooms: number
  bathrooms: number
  location: string
  image: string
  isFeatured: boolean
}

interface RelatedPropertiesProps {
  currentPropertyId: string
  district: string
  type: string
}

export default function RelatedProperties({ currentPropertyId, district, type }: RelatedPropertiesProps) {
  const { t } = useTranslation('property')

  // Load related properties from API - no mock data
  const relatedProperties: Property[] = []

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('relatedProperties.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('relatedProperties.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedProperties.map((property) => (
          <div key={property.id} className="property-card group">
            <div className="relative overflow-hidden">
              <img
                src={property.image}
                alt={property.title}
                className="property-image w-full h-48 object-cover"
              />
              
              <div className="absolute top-4 left-4 bg-champagne text-white px-3 py-1 rounded-full text-sm font-medium">
                {property.type}
              </div>
              
              {property.isFeatured && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  {t('featured')}
                </div>
              )}
              
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-graphite px-3 py-1 rounded-full text-sm font-semibold">
                {formatPrice(property.price, property.currency)}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold text-graphite mb-2 line-clamp-2 group-hover:text-champagne transition-colors">
                {property.title}
              </h3>
              
              <div className="flex items-center text-gray-600 mb-3">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">{property.location}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <HomeIcon className="h-4 w-4 mr-1" />
                  <span>{property.bedrooms}</span>
                </div>
                <div className="flex items-center">
                  <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                  <span>{property.bathrooms}</span>
                </div>
                <div className="flex items-center">
                  <Square3Stack3DIcon className="h-4 w-4 mr-1" />
                  <span>{property.area.toLocaleString()} sq ft</span>
                </div>
              </div>
              
              <Link
                href={`/properties/${property.slug || property.id}`}
                className="btn-primary w-full text-center text-sm py-2"
              >
                {t('viewDetails')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/properties"
          className="btn-secondary text-lg px-8 py-4"
        >
          {t('relatedProperties.viewAll')}
        </Link>
      </div>
    </div>
  )
}
