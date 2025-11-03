import { useTranslation } from 'next-i18next'
import { 
  MapPinIcon, 
  HomeIcon, 
  CurrencyDollarIcon, 
  TrendingUpIcon,
  StarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface Area {
  id: string
  name: string
  nameEn: string
  city: string
  propertiesCount: number
  averagePrice: number
  currency: string
  highlights: string[]
  amenities: string[]
}

interface AreaStatsProps {
  areas: Area[]
}

export default function AreaStats({ areas }: AreaStatsProps) {
  const { t } = useTranslation('areas')

  const totalProperties = areas.reduce((sum, area) => sum + area.propertiesCount, 0)
  const averagePrice = areas.reduce((sum, area) => sum + area.averagePrice, 0) / areas.length
  const totalHighlights = areas.reduce((sum, area) => sum + area.highlights.length, 0)
  const totalAmenities = areas.reduce((sum, area) => sum + area.amenities.length, 0)

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const stats = [
    {
      icon: MapPinIcon,
      value: areas.length,
      label: t('stats.areas'),
      description: t('stats.areasDescription'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: HomeIcon,
      value: totalProperties,
      label: t('stats.properties'),
      description: t('stats.propertiesDescription'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: CurrencyDollarIcon,
      value: formatPrice(averagePrice, 'AED'),
      label: t('stats.averagePrice'),
      description: t('stats.averagePriceDescription'),
      color: 'text-champagne',
      bgColor: 'bg-champagne/10'
    },
    {
      icon: StarIcon,
      value: totalHighlights,
      label: t('stats.landmarks'),
      description: t('stats.landmarksDescription'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: BuildingOfficeIcon,
      value: totalAmenities,
      label: t('stats.amenities'),
      description: t('stats.amenitiesDescription'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      icon: TrendingUpIcon,
      value: '15%',
      label: t('stats.growth'),
      description: t('stats.growthDescription'),
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ]

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('stats.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t('stats.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
              <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-graphite mb-2">
              {stat.value}
            </div>
            <div className="text-lg font-semibold text-graphite mb-2">
              {stat.label}
            </div>
            <div className="text-sm text-gray-600">
              {stat.description}
            </div>
          </div>
          )
        })}
      </div>

      {/* Top Areas by Properties */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-graphite text-center mb-8">
          {t('topAreas.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas
            .sort((a, b) => b.propertiesCount - a.propertiesCount)
            .slice(0, 6)
            .map((area, index) => (
              <div key={area.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
                  <span className="text-champagne font-bold text-lg">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-graphite">{area.nameEn}</div>
                  <div className="text-sm text-gray-600">{area.propertiesCount} {t('properties')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-champagne">
                    {formatPrice(area.averagePrice, area.currency)}
                  </div>
                  <div className="text-xs text-gray-500">{t('average')}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
