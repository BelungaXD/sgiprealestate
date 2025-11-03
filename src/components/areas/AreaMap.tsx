import { useTranslation } from 'next-i18next'
import { 
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface AreaMapProps {
  areaName: string
  coordinates: { lat: number; lng: number }
  properties?: Array<{
    id: string
    title: string
    price: number
    currency: string
    coordinates: { lat: number; lng: number }
    type: string
  }>
}

export default function AreaMap({ areaName, coordinates, properties = [] }: AreaMapProps) {
  const { t } = useTranslation('areas')

  // Generate Google Maps embed URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${coordinates.lat},${coordinates.lng}&zoom=15`

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-graphite mb-4">
          {t('map.title', 'Location Map')}
        </h2>
        <p className="text-gray-600">
          {t('map.subtitle', 'Explore the area and nearby properties')}
        </p>
      </div>

      {/* Map Container */}
      <div className="relative mb-6">
        <div className="w-full h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden">
          {/* Placeholder for map - replace with actual map implementation */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
            <div className="text-center">
              <MapPinIcon className="h-16 w-16 text-champagne mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-graphite mb-2">
                {areaName}
              </h3>
              <p className="text-gray-600 text-sm">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {t('map.placeholder', 'Interactive map will be displayed here')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-lg hover:bg-white transition-colors">
            <span className="text-sm font-medium">+</span>
          </button>
          <button className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-lg hover:bg-white transition-colors">
            <span className="text-sm font-medium">-</span>
          </button>
        </div>
      </div>

      {/* Location Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-graphite mb-3">
            {t('map.locationDetails', 'Location Details')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <MapPinIcon className="h-5 w-5 text-champagne" />
              <span className="text-gray-700">
                <strong>{t('map.coordinates', 'Coordinates')}:</strong> {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <HomeIcon className="h-5 w-5 text-champagne" />
              <span className="text-gray-700">
                <strong>{t('map.area', 'Area')}:</strong> {areaName}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-graphite mb-3">
            {t('map.nearbyProperties', 'Nearby Properties')}
          </h3>
          <div className="text-2xl font-bold text-champagne mb-1">
            {properties.length}
          </div>
          <div className="text-sm text-gray-600">
            {t('map.propertiesAvailable', 'Properties available in this area')}
          </div>
        </div>
      </div>

      {/* Properties List */}
      {properties.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-graphite mb-4">
            {t('map.propertiesList', 'Properties in this Area')}
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
                  <HomeIcon className="h-5 w-5 text-champagne" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-graphite text-sm">
                    {property.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {property.type}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-champagne">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: property.currency,
                      minimumFractionDigits: 0,
                    }).format(property.price)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('map.viewDetails', 'View Details')}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {properties.length > 5 && (
            <div className="text-center mt-4">
              <button className="text-champagne hover:text-champagne/80 text-sm font-medium">
                {t('map.viewAllProperties', 'View All Properties')} ({properties.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Map Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button className="flex-1 bg-champagne text-white py-3 px-6 rounded-lg font-medium hover:bg-champagne/90 transition-colors flex items-center justify-center">
          <MapPinIcon className="h-5 w-5 mr-2" />
          {t('map.getDirections', 'Get Directions')}
        </button>
        <button className="flex-1 border border-champagne text-champagne py-3 px-6 rounded-lg font-medium hover:bg-champagne hover:text-white transition-colors flex items-center justify-center">
          <StarIcon className="h-5 w-5 mr-2" />
          {t('map.saveLocation', 'Save Location')}
        </button>
      </div>

      {/* Map Integration Note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <MapPinIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              {t('map.integrationNote', 'Map Integration')}
            </h4>
            <p className="text-xs text-blue-700">
              {t('map.integrationDescription', 'This map can be integrated with Google Maps, Mapbox, or other mapping services for interactive functionality.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
