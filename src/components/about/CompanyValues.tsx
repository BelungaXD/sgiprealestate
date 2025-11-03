import { useTranslation } from 'next-i18next'
import { 
  ShieldCheckIcon, 
  LightBulbIcon, 
  HeartIcon, 
  GlobeAltIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export default function CompanyValues() {
  const { t } = useTranslation('about')

  const values = [
    {
      icon: ShieldCheckIcon,
      title: t('values.integrity.title'),
      description: t('values.integrity.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: LightBulbIcon,
      title: t('values.innovation.title'),
      description: t('values.innovation.description'),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: HeartIcon,
      title: t('values.clientFocus.title'),
      description: t('values.clientFocus.description'),
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: GlobeAltIcon,
      title: t('values.excellence.title'),
      description: t('values.excellence.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: ClockIcon,
      title: t('values.reliability.title'),
      description: t('values.reliability.description'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: ChartBarIcon,
      title: t('values.results.title'),
      description: t('values.results.description'),
      color: 'text-champagne',
      bgColor: 'bg-champagne/10'
    }
  ]

  return (
    <div>
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('values.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t('values.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {values.map((value, index) => {
          const IconComponent = value.icon
          return (
            <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
              <div className={`w-16 h-16 ${value.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className={`h-8 w-8 ${value.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
