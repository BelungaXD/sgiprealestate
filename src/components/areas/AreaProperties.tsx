import { useTranslation } from 'next-i18next'
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  MapPinIcon,
  StarIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Property {
  id: string
  title: string
  titleEn: string
  type: string
  price: number
  currency: string
  bedrooms: number
  bathrooms: number
  area: number
  areaUnit: string
  image: string
  location: string
  developer: string
  yearBuilt: number
  featured: boolean
}

interface AreaPropertiesProps {
  properties: Property[]
  areaName: string
}

export default function AreaProperties({ properties, areaName }: AreaPropertiesProps) {
  const { t, i18n } = useTranslation(['areas', 'common'])
  const isRussian = i18n.language === 'ru'

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatArea = (area: number, unit: string) => {
    return `${area.toLocaleString()} ${unit}`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-graphite mb-4">
          {t('properties.title', 'Properties in')} {areaName}
        </h2>
        <p className="text-gray-600">
          {t('properties.subtitle', 'Discover available properties in this area')}
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <HomeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {t('properties.noProperties', 'No properties found')}
          </h3>
          <p className="text-gray-500">
            {t('properties.noPropertiesDescription', 'Check back later for new listings')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Property Image */}
              <div className="relative h-48">
                <img
                  src={property.image}
                  alt={isRussian ? property.title : property.titleEn}
                  className="w-full h-full object-cover"
                />
                {property.featured && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-champagne text-white px-2 py-1 rounded-full text-xs font-medium">
                      {t('common.featured', 'Featured')}
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <button className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-full hover:bg-white transition-colors">
                    <StarIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-graphite mb-2 line-clamp-2">
                  {isRussian ? property.title : property.titleEn}
                </h3>
                
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span>{property.location}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <HomeIcon className="h-4 w-4 mr-1" />
                    <span>{property.bedrooms} {t('common.bedrooms', 'bed')}</span>
                  </div>
                  <div className="flex items-center">
                    <span>{property.bathrooms} {t('common.bathrooms', 'bath')}</span>
                  </div>
                  <div className="flex items-center">
                    <span>{formatArea(property.area, property.areaUnit)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-champagne">
                    {formatPrice(property.price, property.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {property.yearBuilt}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-champagne text-white py-2 px-4 rounded-lg font-medium hover:bg-champagne/90 transition-colors">
                    {t('common.viewDetails', 'View Details')}
                  </button>
                  <button className="px-4 py-2 border border-champagne text-champagne rounded-lg hover:bg-champagne hover:text-white transition-colors">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {properties.length > 0 && (
        <div className="text-center mt-8">
          <button className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            {t('properties.loadMore', 'Load More Properties')}
          </button>
        </div>
      )}
    </div>
  )
}
