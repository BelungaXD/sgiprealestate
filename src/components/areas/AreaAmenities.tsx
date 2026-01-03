import { useTranslation } from 'next-i18next'
import { 
  ShoppingBagIcon,
  CakeIcon,
  AcademicCapIcon,
  HeartIcon,
  TruckIcon,
  SignalIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface AreaAmenitiesProps {
  amenities: string[]
  highlights: string[]
}

export default function AreaAmenities({ amenities, highlights }: AreaAmenitiesProps) {
  const { t } = useTranslation('areas')

  // Categorize amenities
  const categorizedAmenities = {
    shopping: amenities.filter(amenity => 
      ['shopping', 'mall', 'market', 'store', 'retail'].some(keyword => 
        amenity.toLowerCase().includes(keyword)
      )
    ),
    dining: amenities.filter(amenity => 
      ['restaurant', 'cafe', 'dining', 'food', 'bar'].some(keyword => 
        amenity.toLowerCase().includes(keyword)
      )
    ),
    education: amenities.filter(amenity => 
      ['school', 'university', 'education', 'college', 'academy'].some(keyword => 
        amenity.toLowerCase().includes(keyword)
      )
    ),
    healthcare: amenities.filter(amenity => 
      ['hospital', 'clinic', 'medical', 'health', 'pharmacy'].some(keyword => 
        amenity.toLowerCase().includes(keyword)
      )
    ),
    transport: amenities.filter(amenity => 
      ['metro', 'bus', 'taxi', 'airport', 'station', 'transport'].some(keyword => 
        amenity.toLowerCase().includes(keyword)
      )
    ),
    recreation: amenities.filter(amenity => 
      ['park', 'beach', 'golf', 'sports', 'gym', 'entertainment'].some(keyword => 
        amenity.toLowerCase().includes(keyword)
      )
    ),
    other: amenities.filter(amenity => 
      !['shopping', 'mall', 'market', 'store', 'retail', 'restaurant', 'cafe', 'dining', 'food', 'bar', 'school', 'university', 'education', 'college', 'academy', 'hospital', 'clinic', 'medical', 'health', 'pharmacy', 'metro', 'bus', 'taxi', 'airport', 'station', 'transport', 'park', 'beach', 'golf', 'sports', 'gym', 'entertainment'].some(keyword => 
        amenity.toLowerCase().includes(keyword)
      )
    )
  }

  const amenityCategories = [
    {
      title: t('amenities.shopping', 'Shopping'),
      icon: ShoppingBagIcon,
      amenities: categorizedAmenities.shopping,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: t('amenities.dining', 'Dining'),
      icon: CakeIcon,
      amenities: categorizedAmenities.dining,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: t('amenities.education', 'Education'),
      icon: AcademicCapIcon,
      amenities: categorizedAmenities.education,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: t('amenities.healthcare', 'Healthcare'),
      icon: HeartIcon,
      amenities: categorizedAmenities.healthcare,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: t('amenities.transport', 'Transportation'),
      icon: TruckIcon,
      amenities: categorizedAmenities.transport,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: t('amenities.recreation', 'Recreation'),
      icon: BuildingStorefrontIcon,
      amenities: categorizedAmenities.recreation,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-graphite mb-4">
          {t('amenities.title', 'Area Amenities')}
        </h2>
        <p className="text-gray-600">
          {t('amenities.subtitle', 'Discover what this area has to offer')}
        </p>
      </div>

      {/* Key Highlights */}
      {highlights.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-graphite mb-4">
            {t('highlights.title', 'Key Highlights')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-champagne/5 rounded-lg">
                <StarIcon className="h-5 w-5 text-champagne flex-shrink-0" />
                <span className="text-gray-700 font-medium">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Amenities by Category */}
      <div className="space-y-8">
        {amenityCategories.map((category, index) => {
          if (category.amenities.length === 0) return null
          
          const IconComponent = category.icon
          return (
            <div key={index}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 ${category.bgColor} rounded-full flex items-center justify-center`}>
                  <IconComponent className={`h-5 w-5 ${category.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-graphite">
                  {category.title}
                </h3>
                <span className="text-sm text-gray-500">
                  ({category.amenities.length})
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.amenities.map((amenity, amenityIndex) => (
                  <div key={amenityIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-2 h-2 ${category.bgColor} rounded-full`} />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Other Amenities */}
      {categorizedAmenities.other.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-graphite mb-4">
            {t('amenities.other', 'Other Amenities')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {categorizedAmenities.other.map((amenity, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No amenities message */}
      {amenities.length === 0 && (
        <div className="text-center py-12">
          <MapPinIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {t('amenities.noAmenities', 'No amenities listed')}
          </h3>
          <p className="text-gray-500">
            {t('amenities.noAmenitiesDescription', 'Amenities information will be updated soon')}
          </p>
        </div>
      )}
    </div>
  )
}
