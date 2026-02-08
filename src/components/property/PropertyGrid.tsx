import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { MapPinIcon, HomeIcon, WrenchScrewdriverIcon, Square3Stack3DIcon, CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface Property {
  id: string
  slug?: string
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

interface PropertyGridProps {
  properties: Property[]
}

export default function PropertyGrid({ properties }: PropertyGridProps) {
  const { t } = useTranslation('properties')
  const { t: tCommon, i18n } = useTranslation('common')

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
      month: 'short'
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {properties.map((property) => (
        <div key={property.id} className="property-card group">
          <div className="relative overflow-hidden">
            <img
              src={property.image}
              alt={property.title}
              className="property-image w-full h-64 object-cover"
            />
            
            {/* Property Type Badge */}
            <div className="absolute top-4 left-4 bg-champagne text-white px-3 py-1 rounded-full text-sm font-medium">
              {property.type}
            </div>
            
            {/* Featured Badge */}
            {property.isFeatured && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                {t('featured')}
              </div>
            )}
            
            {/* Price Badge */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-graphite px-3 py-1 rounded-full text-sm font-semibold">
              {formatPrice(property.price, property.currency)}
            </div>
            
            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex space-x-2">
                <Link
                  href={`/properties/${property.slug || property.id}`}
                  className="bg-white text-graphite px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-500 ease-in-out"
                >
                  {t('viewDetails')}
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-xl font-semibold text-graphite mb-2 line-clamp-2 group-hover:text-champagne transition-colors">
              {property.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {property.description}
            </p>
            
            {/* Location */}
            <div className="flex items-center text-gray-600 mb-4">
              <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{property.location}</span>
            </div>
            
            {/* Property Details */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
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
              <span>
                {(() => {
                  const isMetric = i18n.language === 'ru' || i18n.language === 'ar'
                  const areaSqm = Math.round(property.area * 0.092903)
                  return isMetric
                    ? `${areaSqm.toLocaleString()} ${tCommon('units.sqm')}`
                    : `${property.area.toLocaleString()} sq ft`
                })()}
              </span>
            </div>
            </div>
            
            {/* Additional Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
              <div className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>{property.yearBuilt}</span>
              </div>
              <span className="text-champagne font-medium">{property.developer}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Link
                href={`/properties/${property.slug || property.id}`}
                className="flex-1 btn-primary text-center text-sm py-2 inline-flex items-center justify-center group"
              >
                {t('viewDetails')}
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              <button className="px-4 py-2 border-2 border-champagne bg-white text-champagne rounded-lg hover:bg-champagne-dark hover:text-white transition-all duration-500 ease-in-out text-sm">
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
