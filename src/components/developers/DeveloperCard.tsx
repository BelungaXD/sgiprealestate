import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { 
  BuildingOfficeIcon, 
  CalendarIcon, 
  MapPinIcon, 
  StarIcon,
  GlobeAltIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'

interface Developer {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  logo: string
  founded: number
  headquarters: string
  propertiesCount: number
  averagePrice: number
  currency: string
  slug: string
  website: string
  specialties: string[]
  notableProjects: string[]
  awards: string[]
  rating: number
  marketShare: number
  countries: string[]
}

interface DeveloperCardProps {
  developer: Developer
}

export default function DeveloperCard({ developer }: DeveloperCardProps) {
  const { t, i18n } = useTranslation('developers')
  const isRussian = i18n.language === 'ru'

  const displayName = isRussian ? developer.name : developer.nameEn
  const displayDescription = isRussian ? developer.description : developer.descriptionEn
  const normalizedLogo = normalizeImageUrl(developer.logo)

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="card-hover group">
      <div className="p-6">
        {/* Logo and Basic Info */}
        <div className="flex items-start space-x-4 mb-6">
          {normalizedLogo ? (
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 p-2">
              <Image
                src={normalizedLogo}
                alt={displayName}
                width={64}
                height={64}
                className="max-w-full max-h-full object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-champagne">
                {developer.nameEn.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-graphite mb-2 group-hover:text-champagne transition-colors">
              {displayName}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <MapPinIcon className="h-4 w-4" />
              <span>{developer.headquarters}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4" />
              <span>{t('founded')} {developer.founded}</span>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {displayDescription}
        </p>
        
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-graphite">{developer.propertiesCount}</div>
            <div className="text-xs text-gray-600">{t('properties')}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-champagne">
              {formatPrice(developer.averagePrice, developer.currency)}
            </div>
            <div className="text-xs text-gray-600">{t('averagePrice')}</div>
          </div>
        </div>
        
        {/* Rating */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-graphite">{developer.rating}</span>
            <span className="text-xs text-gray-500">/5</span>
          </div>
          <div className="text-sm text-gray-600">
            {developer.marketShare}% {t('marketShare')}
          </div>
        </div>
        
        {/* Specialties */}
        <div className="mb-4">
          <div className="text-sm font-medium text-graphite mb-2">{t('specialties')}</div>
          <div className="flex flex-wrap gap-1">
            {developer.specialties.slice(0, 3).map((specialty, index) => (
              <span
                key={index}
                className="text-xs bg-champagne/10 text-champagne px-2 py-1 rounded-full"
              >
                {specialty}
              </span>
            ))}
            {developer.specialties.length > 3 && (
              <span className="text-xs text-gray-500">
                +{developer.specialties.length - 3} {t('more')}
              </span>
            )}
          </div>
        </div>
        
        {/* Notable Projects */}
        <div className="mb-6">
          <div className="text-sm font-medium text-graphite mb-2">{t('notableProjects')}</div>
          <div className="space-y-1">
            {developer.notableProjects.slice(0, 2).map((project, index) => (
              <div key={index} className="text-xs text-gray-600 flex items-center">
                <TrophyIcon className="h-3 w-3 mr-1 text-champagne" />
                {project}
              </div>
            ))}
            {developer.notableProjects.length > 2 && (
              <div className="text-xs text-gray-500">
                +{developer.notableProjects.length - 2} {t('moreProjects')}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Link
            href={`/developers/${developer.slug}`}
            className="flex-1 btn-primary text-center text-sm py-2"
          >
            {t('learnMore')}
          </Link>
          {developer.website && (
            <a
              href={developer.website.startsWith('http') ? developer.website : `https://${developer.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-champagne text-champagne rounded-lg hover:bg-champagne hover:text-white transition-colors text-sm flex items-center justify-center"
              title={t('visitWebsite') || 'Visit Website'}
            >
              <GlobeAltIcon className="h-4 w-4" />
            </a>
          )}
          </div>
          <Link
            href={`/properties?developer=${encodeURIComponent(developer.nameEn)}`}
            className="w-full btn-secondary text-center text-sm py-2"
          >
            {t('viewProperties') || 'View Properties'}
          </Link>
        </div>
      </div>
    </div>
  )
}
