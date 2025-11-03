import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { MapPinIcon, HomeIcon, CurrencyDollarIcon, StarIcon } from '@heroicons/react/24/outline'

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

interface AreaCardProps {
  area: Area
}

export default function AreaCard({ area }: AreaCardProps) {
  const { t, i18n } = useTranslation('areas')
  const isRussian = i18n.language === 'ru'

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const displayName = isRussian ? area.name : area.nameEn
  const displayDescription = isRussian ? area.description : area.descriptionEn

  return (
    <div className="card-hover group">
      <div className="relative overflow-hidden">
        <img
          src={area.image}
          alt={displayName}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* City Badge */}
        <div className="absolute top-4 left-4 bg-champagne text-white px-3 py-1 rounded-full text-sm font-medium">
          {area.city}
        </div>
        
        {/* Properties Count */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-graphite px-3 py-1 rounded-full text-sm font-semibold">
          {area.propertiesCount} {t('properties')}
        </div>
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex space-x-2">
            <Link
              href={`/areas/${area.slug}`}
              className="bg-white text-graphite px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {t('explore')}
            </Link>
            <Link
              href={`/properties?district=${area.nameEn}`}
              className="bg-champagne text-white px-4 py-2 rounded-lg font-medium hover:bg-champagne/90 transition-colors"
            >
              {t('viewProperties')}
            </Link>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold text-graphite mb-2 group-hover:text-champagne transition-colors">
          {displayName}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {displayDescription}
        </p>
        
        {/* Key Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <HomeIcon className="h-4 w-4 mr-1" />
            <span>{area.propertiesCount} {t('properties')}</span>
          </div>
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            <span className="font-semibold text-champagne">
              {formatPrice(area.averagePrice, area.currency)}
            </span>
          </div>
        </div>
        
        {/* Highlights */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {area.highlights.slice(0, 3).map((highlight, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {highlight}
              </span>
            ))}
            {area.highlights.length > 3 && (
              <span className="text-xs text-gray-500">
                +{area.highlights.length - 3} {t('more')}
              </span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link
            href={`/areas/${area.slug}`}
            className="flex-1 btn-primary text-center text-sm py-2"
          >
            {t('learnMore')}
          </Link>
          <Link
            href={`/properties?district=${area.nameEn}`}
            className="px-4 py-2 border border-champagne text-champagne rounded-lg hover:bg-champagne hover:text-white transition-colors text-sm"
          >
            {t('properties')}
          </Link>
        </div>
      </div>
    </div>
  )
}
