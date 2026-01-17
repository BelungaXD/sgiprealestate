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
  marketInsights: {
    priceGrowth: number
    rentalYield: number
    demandLevel: string
    investmentRating: number
  }
}

interface AreaHeroProps {
  area: Area
}

export default function AreaHero({ area }: AreaHeroProps) {
  const { t, i18n } = useTranslation('areas')
  const isRussian = i18n.language === 'ru'

  const displayName = isRussian ? area.name : area.nameEn
  const displayDescription = isRussian ? area.description : area.descriptionEn

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement
    if (target.src !== '/images/hero.jpg') {
      target.src = '/images/hero.jpg'
    }
  }

  return (
    <div className="relative h-96 md:h-[500px] overflow-hidden">
      <img
        src={area.image || '/images/hero.jpg'}
        alt={displayName}
        className="w-full h-full object-cover"
        onError={handleImageError}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="container-custom pb-16">
          <div className="max-w-4xl">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-white/80 text-sm mb-4">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <span>/</span>
              <a href="/areas" className="hover:text-white transition-colors">{t('areas')}</a>
              <span>/</span>
              <span className="text-white">{displayName}</span>
            </nav>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {displayName}
            </h1>
            
            {/* Description */}
            <p className="text-xl text-white/90 mb-8 max-w-3xl">
              {displayDescription}
            </p>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 text-white mb-2">
                  <HomeIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('properties')}</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {area.propertiesCount}
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 text-white mb-2">
                  <CurrencyDollarIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('averagePrice')}</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatPrice(area.averagePrice, area.currency)}
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 text-white mb-2">
                  <StarIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('investmentRating')}</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {area.marketInsights.investmentRating}/5
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2 text-white mb-2">
                  <MapPinIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('city')}</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {area.city}
                </div>
              </div>
            </div>
            
            {/* Market Insights */}
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="bg-green-500/20 text-green-200 px-4 py-2 rounded-full text-sm font-medium">
                +{area.marketInsights.priceGrowth}% {t('priceGrowth')}
              </div>
              <div className="bg-blue-500/20 text-blue-200 px-4 py-2 rounded-full text-sm font-medium">
                {area.marketInsights.rentalYield}% {t('rentalYield')}
              </div>
              <div className="bg-champagne/20 text-champagne px-4 py-2 rounded-full text-sm font-medium">
                {area.marketInsights.demandLevel} {t('demand')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
