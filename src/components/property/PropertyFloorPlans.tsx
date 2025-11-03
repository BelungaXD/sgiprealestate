import { useState } from 'react'
import { Square3Stack3DIcon, HomeIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'

interface FloorPlan {
  id: string
  title: string
  area: number
  bedrooms: number
  bathrooms: number
  url: string
}

interface PropertyFloorPlansProps {
  floorPlans: FloorPlan[]
}

export default function PropertyFloorPlans({ floorPlans }: PropertyFloorPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(floorPlans[0] || null)

  if (floorPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <Square3Stack3DIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Floor Plans Available</h3>
        <p className="text-gray-500">Floor plans for this property will be available soon.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-graphite mb-4">Floor Plans</h3>
        <p className="text-gray-600">Explore the different layouts available for this property.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Floor Plan List */}
        <div className="space-y-4">
          {floorPlans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedPlan?.id === plan.id
                  ? 'border-champagne bg-champagne/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Square3Stack3DIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-graphite">{plan.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center">
                      <Square3Stack3DIcon className="h-4 w-4 mr-1" />
                      <span>{plan.area} sq ft</span>
                    </div>
                    <div className="flex items-center">
                      <HomeIcon className="h-4 w-4 mr-1" />
                      <span>{plan.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center">
                      <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                      <span>{plan.bathrooms} bath</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Floor Plan */}
        <div className="lg:col-span-2">
          {selectedPlan && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-graphite mb-4">
                {selectedPlan.title}
              </h4>
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={selectedPlan.url}
                  alt={selectedPlan.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-champagne">{selectedPlan.area}</div>
                  <div className="text-sm text-gray-600">sq ft</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-champagne">{selectedPlan.bedrooms}</div>
                  <div className="text-sm text-gray-600">bedrooms</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-champagne">{selectedPlan.bathrooms}</div>
                  <div className="text-sm text-gray-600">bathrooms</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
