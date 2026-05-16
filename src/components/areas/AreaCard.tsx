import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'next-i18next/pages'
import { HomeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { localizedAreaContent } from '@/lib/areaLocaleContent'

interface Area {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn?: string
  descriptionRu?: string
  descriptionAr?: string
  tags?: string[]
  tagsRu?: string[]
  tagsAr?: string[]
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
  const currentLocale = i18n.language || 'en'

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const locale = currentLocale === 'ru' || currentLocale === 'ar' ? currentLocale : 'en'
  const localized = localizedAreaContent(area, locale)
  const displayName = localized.name
  const displayDescription = localized.description
  const displayHighlights = localized.tags

  const imageSrc = area.image || '/images/hero.jpg'
  const areaPropertiesHref = `/properties?area=${encodeURIComponent(localized.name || area.nameEn || area.name)}`

  return (
    <div className="card-hover group">
      <div className="relative overflow-hidden">
        <Link
          href={areaPropertiesHref}
          className="block relative"
          aria-label={`${displayName} ${t('viewProperties')}`}
        >
          <Image
            src={imageSrc}
            alt={displayName}
            width={800}
            height={400}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />

          <div className="absolute top-4 left-4 bg-champagne text-white px-3 py-1 rounded-full text-sm font-medium">
            {area.city}
          </div>

          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs text-graphite px-3 py-1 rounded-full text-sm font-semibold">
            {area.propertiesCount} {t('properties')}
          </div>
        </Link>
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
            {displayHighlights.slice(0, 3).map((highlight, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  {highlight}
                </span>
              ))}
            {displayHighlights.length > 3 && (
              <span className="text-xs text-gray-500">
                +{displayHighlights.length - 3} {t('more')}
              </span>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
