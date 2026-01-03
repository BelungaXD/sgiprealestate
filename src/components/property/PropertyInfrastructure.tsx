import { MapPinIcon, ClockIcon, TruckIcon, ShoppingBagIcon, GraduationCapIcon, HospitalIcon, CakeIcon } from '@heroicons/react/24/outline'

interface InfrastructureItem {
  name: string
  distance: string
  type: string
}

interface InfrastructureCategory {
  category: string
  items: InfrastructureItem[]
}

interface PropertyInfrastructureProps {
  infrastructure: InfrastructureCategory[]
}

const categoryIcons: { [key: string]: any } = {
  'Shopping': ShoppingBagIcon,
  'Education': GraduationCapIcon,
  'Healthcare': HospitalIcon,
  'Dining': CakeIcon,
  'Transportation': TruckIcon,
  'Entertainment': ClockIcon,
}

export default function PropertyInfrastructure({ infrastructure }: PropertyInfrastructureProps) {
  if (infrastructure.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Infrastructure Information</h3>
        <p className="text-gray-500">Detailed infrastructure information will be available soon.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-4">Nearby Infrastructure</h3>
        <p className="text-gray-600">Discover what's around this property - from shopping centers to schools and healthcare facilities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {infrastructure.map((category, categoryIndex) => {
          const IconComponent = categoryIcons[category.category] || MapPinIcon
          
          return (
            <div key={categoryIndex} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-champagne" />
                </div>
                <h4 className="text-xl font-semibold text-graphite">{category.category}</h4>
              </div>
              
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-graphite">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.type}</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-champagne">
                      {item.distance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Map Integration Placeholder */}
      <div className="mt-8">
        <h4 className="text-xl font-semibold text-graphite mb-4">Interactive Map</h4>
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500">Interactive map will be integrated here</p>
            <p className="text-sm text-gray-400">Showing nearby amenities and points of interest</p>
          </div>
        </div>
      </div>
    </div>
  )
}
