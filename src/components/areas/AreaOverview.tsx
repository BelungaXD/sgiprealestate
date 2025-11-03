import { useTranslation } from 'next-i18next'
import { 
  MapPinIcon, 
  HomeIcon, 
  CurrencyDollarIcon, 
  StarIcon,
  BuildingOfficeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

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

interface AreaOverviewProps {
  area: Area
}

export default function AreaOverview({ area }: AreaOverviewProps) {
  const { t, i18n } = useTranslation('areas')
  const isRussian = i18n.language === 'ru'

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Hero Image */}
      <div className="relative h-64 md:h-80">
        <img
          src={area.image}
          alt={isRussian ? area.name : area.nameEn}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {isRussian ? area.name : area.nameEn}
          </h1>
          <p className="text-lg text-gray-200">
            {area.city}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-graphite mb-4">
            {t('overview.title', 'Area Overview')}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {isRussian ? area.description : area.descriptionEn}
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <HomeIcon className="h-8 w-8 text-champagne mx-auto mb-2" />
            <div className="text-2xl font-bold text-graphite mb-1">
              {area.propertiesCount}
            </div>
            <div className="text-sm text-gray-600">
              {t('properties')}
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <CurrencyDollarIcon className="h-8 w-8 text-champagne mx-auto mb-2" />
            <div className="text-2xl font-bold text-graphite mb-1">
              {formatPrice(area.averagePrice, area.currency)}
            </div>
            <div className="text-sm text-gray-600">
              {t('averagePrice')}
            </div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <StarIcon className="h-8 w-8 text-champagne mx-auto mb-2" />
            <div className="text-2xl font-bold text-graphite mb-1">
              {area.highlights.length}
            </div>
            <div className="text-sm text-gray-600">
              {t('landmarks')}
            </div>
          </div>
        </div>

        {/* Highlights */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-graphite mb-4">
            {t('highlights.title', 'Key Highlights')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {area.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-champagne flex-shrink-0" />
                <span className="text-gray-700">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-graphite mb-4">
            {t('amenities.title', 'Amenities')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {area.amenities.map((amenity, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-champagne/10 text-champagne rounded-full text-sm font-medium"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Location Info */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-bold text-graphite mb-4">
            {t('location.title', 'Location Information')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <MapPinIcon className="h-5 w-5 text-champagne" />
                <span className="font-medium text-graphite">
                  {t('location.coordinates', 'Coordinates')}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                {area.coordinates.lat.toFixed(6)}, {area.coordinates.lng.toFixed(6)}
              </p>
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <BuildingOfficeIcon className="h-5 w-5 text-champagne" />
                <span className="font-medium text-graphite">
                  {t('location.city', 'City')}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                {area.city}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
