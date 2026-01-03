import { useTranslation } from 'next-i18next'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

export default function Partners() {
  const { t } = useTranslation('home')

  // Load partners from API - no mock data
  const partners: any[] = []

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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner, index) => (
            <AnimateOnScroll
              key={index}
              animation="scale-in"
              delay={index * 100}
            >
              <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl font-bold text-champagne">
                    {partner.name.charAt(0)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {partner.name}
                </p>
              </div>
            </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
