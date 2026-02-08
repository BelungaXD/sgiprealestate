import { useTranslation } from 'next-i18next'
import {
  HomeIcon,
  WrenchScrewdriverIcon,
  Square3Stack3DIcon,
  CalendarIcon,
  MapPinIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import PropertyMap from './PropertyMap'

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
      <div className="transition-all duration-300 hover:scale-[1.01]">
        <h3 className="text-2xl font-bold text-graphite mb-4">
          {t('description')}
        </h3>
        <p className="text-gray-700 leading-relaxed text-base">
          {property.description}
        </p>
      </div>

      {/* Key Details - Grid of 6 cards */}
      <div>
        <h3 className="text-2xl font-bold text-graphite mb-6">
          Key Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Bedrooms */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-champagne group cursor-pointer">
            <div className="w-12 h-12 bg-champagne/10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-champagne group-hover:scale-110">
              <HomeIcon className="h-6 w-6 text-champagne transition-colors duration-300 group-hover:text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium mb-1">Bedrooms</div>
              <div className="text-lg font-bold text-graphite">{property.bedrooms}</div>
            </div>
          </div>

          {/* Bathrooms */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-champagne group cursor-pointer">
            <div className="w-12 h-12 bg-champagne/10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-champagne group-hover:scale-110">
              <WrenchScrewdriverIcon className="h-6 w-6 text-champagne transition-colors duration-300 group-hover:text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium mb-1">Bathrooms</div>
              <div className="text-lg font-bold text-graphite">{property.bathrooms}</div>
            </div>
          </div>

          {/* Area */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-champagne group cursor-pointer">
            <div className="w-12 h-12 bg-champagne/10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-champagne group-hover:scale-110">
              <Square3Stack3DIcon className="h-6 w-6 text-champagne transition-colors duration-300 group-hover:text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium mb-1">Area</div>
              <div className="text-lg font-bold text-graphite">{property.area.toLocaleString()} sq ft</div>
            </div>
          </div>

          {/* Year Built */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-champagne group cursor-pointer">
            <div className="w-12 h-12 bg-champagne/10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-champagne group-hover:scale-110">
              <CalendarIcon className="h-6 w-6 text-champagne transition-colors duration-300 group-hover:text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium mb-1">Year Built</div>
              <div className="text-lg font-bold text-graphite">{property.yearBuilt || 'N/A'}</div>
            </div>
          </div>

          {/* Parking */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-champagne group cursor-pointer">
            <div className="w-12 h-12 bg-champagne/10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-champagne group-hover:scale-110">
              <MapPinIcon className="h-6 w-6 text-champagne transition-colors duration-300 group-hover:text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium mb-1">Parking</div>
              <div className="text-lg font-bold text-graphite">{property.parking} spaces</div>
            </div>
          </div>

          {/* Developer */}
          {property.developer && (
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-champagne group cursor-pointer">
              <div className="w-12 h-12 bg-champagne/10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-champagne group-hover:scale-110">
                <span className="text-xl font-bold text-champagne transition-colors duration-300 group-hover:text-white">{property.developer.charAt(0)}</span>
              </div>
              <div>
                <div className="text-xs text-gray-600 font-medium mb-1">Developer</div>
                <div className="text-lg font-bold text-graphite truncate">{property.developer}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features & Amenities Grid */}
      {(property.features && property.features.length > 0) || (property.amenities && property.amenities.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
              <h3 className="text-2xl font-bold text-graphite mb-5">
                {t('features')}
              </h3>
              <div className="space-y-3">
                {property.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 group transition-all duration-200 hover:translate-x-1">
                    <div className="mt-0.5 flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-champagne group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-gray-700 group-hover:text-graphite transition-colors">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
              <h3 className="text-2xl font-bold text-graphite mb-5">
                {t('amenities')}
              </h3>
              <div className="space-y-3">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-start space-x-3 group transition-all duration-200 hover:translate-x-1">
                    <div className="mt-0.5 flex-shrink-0">
                      <CheckIcon className="h-5 w-5 text-champagne group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-gray-700 group-hover:text-graphite transition-colors">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Location & Map */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
        <h3 className="text-2xl font-bold text-graphite mb-4">
          {t('location')}
        </h3>
        <div className="flex items-center space-x-3 mb-4">
          <MapPinIcon className="h-5 w-5 text-champagne transition-transform duration-300 hover:scale-110" />
          <span className="text-base text-graphite">{property.location}</span>
        </div>
        <div className="h-96 bg-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-inner">
          <PropertyMap
            location={property.location}
            coordinates={property.coordinates}
          />
        </div>
      </div>

    </div>
  )
}
