import { useTranslation } from 'next-i18next'
import { TrophyIcon, StarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function AwardsSection() {
  const { t } = useTranslation('about')

  const awards = [
    {
      icon: TrophyIcon,
      title: t('awards.bestDeveloper.title'),
      year: '2023',
      organization: t('awards.bestDeveloper.organization'),
      description: t('awards.bestDeveloper.description'),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: StarIcon,
      title: t('awards.excellence.title'),
      year: '2022',
      organization: t('awards.excellence.organization'),
      description: t('awards.excellence.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: ShieldCheckIcon,
      title: t('awards.trusted.title'),
      year: '2021',
      organization: t('awards.trusted.organization'),
      description: t('awards.trusted.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: TrophyIcon,
      title: t('awards.innovation.title'),
      year: '2020',
      organization: t('awards.innovation.organization'),
      description: t('awards.innovation.description'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: StarIcon,
      title: t('awards.customerService.title'),
      year: '2019',
      organization: t('awards.customerService.organization'),
      description: t('awards.customerService.description'),
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: ShieldCheckIcon,
      title: t('awards.sustainability.title'),
      year: '2018',
      organization: t('awards.sustainability.organization'),
      description: t('awards.sustainability.description'),
      color: 'text-champagne',
      bgColor: 'bg-champagne/10'
    }
  ]

  return (
    <div>
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('awards.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t('awards.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {awards.map((award, index) => {
          const IconComponent = award.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 group">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 ${award.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className={`h-6 w-6 ${award.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-graphite">
                      {award.title}
                    </h3>
                    <span className="text-sm font-bold text-champagne">
                      {award.year}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {award.organization}
                  </p>
                  <p className="text-sm text-gray-500">
                    {award.description}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Recognition */}
      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-graphite mb-4">
            {t('awards.additional.title')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('awards.additional.description')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-champagne mb-2">15+</div>
              <div className="text-sm text-gray-600">{t('awards.additional.awards')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-champagne mb-2">5</div>
              <div className="text-sm text-gray-600">{t('awards.additional.years')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-champagne mb-2">98%</div>
              <div className="text-sm text-gray-600">{t('awards.additional.satisfaction')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-champagne mb-2">500+</div>
              <div className="text-sm text-gray-600">{t('awards.additional.clients')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
