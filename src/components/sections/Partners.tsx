import { useTranslation } from 'next-i18next'

export default function Partners() {
  const { t } = useTranslation('home')

  // Mock partners data - in real app this would come from API
  const partners = [
    { name: 'Emaar Properties', logo: '/images/partners/emaar.png' },
    { name: 'Damac Properties', logo: '/images/partners/damac.png' },
    { name: 'Sobha Realty', logo: '/images/partners/sobha.png' },
    { name: 'Nakheel', logo: '/images/partners/nakheel.png' },
    { name: 'Meraas', logo: '/images/partners/meraas.png' },
    { name: 'Dubai Properties', logo: '/images/partners/dubai-properties.png' },
  ]

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-graphite mb-4">
            {t('partners.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('partners.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
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
          ))}
        </div>
      </div>
    </section>
  )
}
