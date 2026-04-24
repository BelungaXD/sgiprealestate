import Link from 'next/link'
import { useTranslation } from 'next-i18next/pages'
import PropertyListingImage from '@/components/property/PropertyListingImage'
import {
  MapPinIcon,
  HomeIcon,
  WrenchScrewdriverIcon,
  Square3Stack3DIcon,
  CalendarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

interface Property {
  id: string
  slug?: string
  title: string
  description: string
  price: number
  currency: string
  type: string
  listingMarket?: 'PRIMARY' | 'SECONDARY'
  area: number
  bedrooms: number
  bathrooms: number
  parking: number
  location: string
  district: string
  image: string
  isFeatured: boolean
  yearBuilt: number
  completionDate: string
  developer: string
  developerLogo?: string
  occupancyStatus?: string
}

interface PropertyGridProps {
  properties: Property[]
}

export default function PropertyGrid({ properties }: PropertyGridProps) {
  const { t } = useTranslation('properties')

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  const unitTypeLabel = (property: Property) => {
    const ty = property.type
    return ty === 'PENTHOUSE'
      ? t('types.penthouse')
      : ty === 'VILLA'
        ? t('types.villa')
        : ty === 'APARTMENT'
          ? t('types.apartment')
          : ty === 'TOWNHOUSE'
            ? t('types.townhouse')
            : ty === 'OFFICE'
              ? t('types.office')
              : ty === 'STUDIO'
                ? t('types.studio')
                : ty
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {properties.map((property) => {
        const isSecondary = property.listingMarket === 'SECONDARY'
        return (
          <div key={property.id} className="property-card group">
            <div className="relative overflow-hidden">
              <PropertyListingImage
                imageUrl={property.image}
                alt={property.title}
                className="property-image w-full h-64 object-cover"
              />

              <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[90%]">
                <span className="bg-graphite/85 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {isSecondary
                    ? t('secondary', 'Secondary')
                    : t('primary', 'Primary')}
                </span>
                <span className="bg-champagne text-white px-3 py-1 rounded-full text-sm font-medium">
                  {unitTypeLabel(property)}
                </span>
              </div>

              {property.isFeatured && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  {t('featured')}
                </div>
              )}

              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-graphite px-3 py-1 rounded-full text-sm font-semibold">
                {formatPrice(property.price, property.currency)}
              </div>

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex space-x-2">
                  <Link
                    href={`/properties/${property.slug || property.id}`}
                    className="bg-white text-graphite px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-500 ease-in-out"
                  >
                    {t('viewDetails')}
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold text-graphite mb-2 line-clamp-2 group-hover:text-champagne transition-colors">
                {property.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {property.description}
              </p>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="text-sm truncate">{property.location}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <HomeIcon className="h-4 w-4 mr-1" />
                  <span>{property.bedrooms}</span>
                </div>
                <div className="flex items-center">
                  <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
                  <span>{property.bathrooms}</span>
                </div>
                <div className="flex items-center">
                  <Square3Stack3DIcon className="h-4 w-4 mr-1" />
                  <span>{property.area.toLocaleString()} m²</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4 min-h-[2rem]">
                {isSecondary ? (
                  <>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>
                        {property.yearBuilt
                          ? `${t('yearBuilt')}: ${property.yearBuilt}`
                          : '—'}
                      </span>
                    </div>
                    <span className="text-champagne font-medium text-right">
                      {property.occupancyStatus === 'VACANT'
                        ? t('vacant', 'Vacant')
                        : property.occupancyStatus === 'TENANTED'
                          ? t('tenanted', 'Tenanted')
                          : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {property.developerLogo ? (
                        <img
                          src={property.developerLogo}
                          alt=""
                          className="h-8 w-auto object-contain max-w-[100px]"
                        />
                      ) : null}
                    </div>
                    <span className="text-champagne font-medium text-right line-clamp-2">
                      {property.developer}
                    </span>
                  </>
                )}
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/properties/${property.slug || property.id}`}
                  className="flex-1 btn-primary btn-sm text-center inline-flex items-center justify-center group"
                >
                  {t('viewDetails')}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
                <button className="btn-primary btn-sm inline-flex items-center justify-center">
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

