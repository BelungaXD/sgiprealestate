import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { ArrowRightIcon, MapPinIcon, HomeIcon, WrenchScrewdriverIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

interface FeaturedPropertiesProps {
  initialProperties?: any[]
}

export default function FeaturedProperties({ initialProperties = [] }: FeaturedPropertiesProps) {
  const { t } = useTranslation('home')
  const [properties, setProperties] = useState<any[]>(initialProperties)
  const [loading, setLoading] = useState(initialProperties.length === 0)

  // Use initial properties if provided, otherwise show empty
  useEffect(() => {
    if (initialProperties.length > 0) {
      setProperties(initialProperties)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [initialProperties])

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <AnimateOnScroll animation="fade-up" delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-graphite mb-4">
              {t('featured.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('featured.subtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">Loading featured properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">No featured properties available</p>
            </div>
          ) : (
            properties.map((property, index) => (
            <AnimateOnScroll
              key={property.id}
              animation="fade-up"
              delay={index * 100}
            >
              <div className="property-card">
              <div className="relative overflow-hidden">
                <Image
                  src={property.image}
                  alt={property.title}
                  width={800}
                  height={400}
                  className="property-image w-full h-64 object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
                <div className="absolute top-4 left-4 bg-champagne text-white px-3 py-1 rounded-full text-sm font-medium">
                  {property.type}
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-graphite px-3 py-1 rounded-full text-sm font-semibold">
                  {formatPrice(property.price, property.currency)}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-graphite mb-2 line-clamp-2">
                  {property.title}
                </h3>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">{property.location}</span>
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
                    <span>{property.area} sq ft</span>
                  </div>
                </div>
                
                <Link
                  href={`/properties/${property.slug || property.id}`}
                  className="btn-primary w-full text-center inline-flex items-center justify-center group"
                >
                  {t('featured.viewDetails')}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
            </AnimateOnScroll>
            ))
          )}
        </div>

        <div className="text-center">
          <Link
            href="/properties"
            className="btn-secondary text-lg px-8 py-4 inline-flex items-center group"
          >
            {t('featured.viewAllProperties')}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
