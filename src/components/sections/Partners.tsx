import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import Link from 'next/link'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

interface Partner {
  name: string
  logo: string
  website?: string
}

export default function Partners() {
  const { t, ready } = useTranslation('home')

  // Trusted partners - developers
  const partners: Partner[] = [
    {
      name: 'Emaar',
      logo: '/uploads/developers/emaar_logo.png',
      website: 'https://www.emaar.com',
    },
    {
      name: 'Sobha',
      logo: '/uploads/developers/sobha_logo.png',
      website: 'https://www.sobha.com',
    },
  ]

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <AnimateOnScroll animation="fade-up" delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-graphite mb-4">
              {t('partners.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('partners.subtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8 items-center justify-items-center max-w-4xl mx-auto mb-12">
          {partners.map((partner, index) => (
            <AnimateOnScroll
              key={index}
              animation="scale-in"
              delay={index * 100}
            >
              {partner.website ? (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 w-full h-full"
                >
                  <div className="w-full h-20 flex items-center justify-center">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={120}
                      height={80}
                      className="max-w-full max-h-full object-contain"
                      unoptimized
                    />
                  </div>
                </a>
              ) : (
                <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 w-full h-full">
                  <div className="w-full h-20 flex items-center justify-center">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      width={120}
                      height={80}
                      className="max-w-full max-h-full object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={200}>
          <div className="text-center">
            <Link
              href="/developers"
              className="btn-primary inline-flex items-center"
            >
              {ready ? t('partners.viewAllDevelopers') : 'View All Developers'}
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
