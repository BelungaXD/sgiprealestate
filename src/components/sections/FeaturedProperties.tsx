import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { ArrowRightIcon, MapPinIcon, HomeIcon, WrenchScrewdriverIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline'

export default function FeaturedProperties() {
  const { t } = useTranslation('home')

  // Mock data - in real app this would come from API
  const properties = [
    {
      id: '1',
      title: 'Luxury Penthouse in Downtown Dubai',
      location: 'Downtown Dubai, UAE',
      price: 2500000,
      currency: 'AED',
      bedrooms: 3,
      bathrooms: 3,
      area: 2500,
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      type: 'Penthouse',
    },
    {
      id: '2',
      title: 'Modern Villa in Palm Jumeirah',
      location: 'Palm Jumeirah, UAE',
      price: 4500000,
      currency: 'AED',
      bedrooms: 5,
      bathrooms: 4,
      area: 4500,
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      type: 'Villa',
    },
    {
      id: '3',
      title: 'Elegant Apartment in Marina',
      location: 'Dubai Marina, UAE',
      price: 1800000,
      currency: 'AED',
      bedrooms: 2,
      bathrooms: 2,
      area: 1800,
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      type: 'Apartment',
    },
  ]

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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-graphite mb-4">
            {t('featured.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('featured.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {properties.map((property) => (
            <div key={property.id} className="property-card">
              <div className="relative overflow-hidden">
                <img
                  src={property.image}
                  alt={property.title}
                  className="property-image w-full h-64 object-cover"
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
                  href={`/properties/${property.id}`}
                  className="btn-primary w-full text-center inline-block"
                >
                  {t('featured.viewDetails')}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/properties"
            className="btn-secondary text-lg px-8 py-4 inline-flex items-center group"
          >
            {t('featured.viewAllProperties')}
            <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
