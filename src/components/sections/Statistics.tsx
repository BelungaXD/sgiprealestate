import { useTranslation } from 'next-i18next'

export default function Statistics() {
  const { t } = useTranslation('home')

  const stats = [
    {
      number: '10+',
      label: t('stats.yearsExperience'),
      description: t('stats.yearsDescription'),
    },
    {
      number: '500+',
      label: t('stats.propertiesSold'),
      description: t('stats.propertiesDescription'),
    },
    {
      number: '6',
      label: t('stats.developers'),
      description: t('stats.developersDescription'),
    },
    {
      number: '98%',
      label: t('stats.clientSatisfaction'),
      description: t('stats.satisfactionDescription'),
    },
  ]

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-graphite mb-4">
            {t('stats.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('stats.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="bg-champagne/10 rounded-2xl p-8 mb-4 group-hover:bg-champagne/20 transition-colors duration-300">
                <div className="text-4xl md:text-5xl font-bold text-champagne mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-graphite mb-2">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
