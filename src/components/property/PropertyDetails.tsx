import { useTranslation } from 'next-i18next'
import { 
  HomeIcon, 
  WrenchScrewdriverIcon, 
  Square3Stack3DIcon,
  CalendarIcon,
  MapPinIcon,
  CheckIcon
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
  features: string[]
  amenities: string[]
  yearBuilt: number
  completionDate: string
  developer: string
  developerLogo: string
  isFeatured: boolean
  coordinates: { lat: number; lng: number }
}

interface PropertyDetailsProps {
  property: Property
}

export default function PropertyDetails({ property }: PropertyDetailsProps) {
  const { t } = useTranslation('property')

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

  return (
    <div className="space-y-8">
      {/* Description */}
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-4">
          {t('description')}
        </h3>
        <p className="text-gray-600 leading-relaxed">
          {property.description}
        </p>
      </div>

      {/* Key Details */}
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-6">
          {t('keyDetails')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
              <HomeIcon className="h-5 w-5 text-champagne" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('bedrooms')}</div>
              <div className="text-lg font-semibold text-graphite">{property.bedrooms}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
              <WrenchScrewdriverIcon className="h-5 w-5 text-champagne" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('bathrooms')}</div>
              <div className="text-lg font-semibold text-graphite">{property.bathrooms}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
              <Square3Stack3DIcon className="h-5 w-5 text-champagne" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('area')}</div>
              <div className="text-lg font-semibold text-graphite">{property.area.toLocaleString()} sq ft</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-champagne" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('yearBuilt')}</div>
              <div className="text-lg font-semibold text-graphite">{property.yearBuilt}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
              <MapPinIcon className="h-5 w-5 text-champagne" />
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('parking')}</div>
              <div className="text-lg font-semibold text-graphite">{property.parking} {t('spaces')}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
              <div className="text-champagne font-bold text-lg">S</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('developer')}</div>
              <div className="text-lg font-semibold text-graphite">{property.developer}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-6">
          {t('features')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {property.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckIcon className="h-5 w-5 text-champagne flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-6">
          {t('amenities')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {property.amenities.map((amenity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <CheckIcon className="h-5 w-5 text-champagne flex-shrink-0" />
              <span className="text-gray-700">{amenity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-6">
          {t('location')}
        </h3>
        <div className="bg-gray-100 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <MapPinIcon className="h-6 w-6 text-champagne" />
            <span className="text-lg font-medium text-graphite">{property.location}</span>
          </div>
          <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Google Maps will be integrated here</span>
          </div>
        </div>
      </div>

      {/* Developer Info */}
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-6">
          {t('developer')}
        </h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-champagne/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-champagne">
                {property.developer.charAt(0)}
              </span>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-graphite">{property.developer}</h4>
              <p className="text-gray-600">{t('developerDescription')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
