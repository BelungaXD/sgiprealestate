import { useTranslation } from 'next-i18next'
import { 
  ShieldCheckIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

export default function ServiceBenefits() {
  const { t } = useTranslation('services')

  const benefits = [
    {
      icon: ShieldCheckIcon,
      title: t('benefits.trust.title'),
      description: t('benefits.trust.description'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: ClockIcon,
      title: t('benefits.speed.title'),
      description: t('benefits.speed.description'),
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: CurrencyDollarIcon,
      title: t('benefits.value.title'),
      description: t('benefits.value.description'),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: UserGroupIcon,
      title: t('benefits.expertise.title'),
      description: t('benefits.expertise.description'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: ChartBarIcon,
      title: t('benefits.analytics.title'),
      description: t('benefits.analytics.description'),
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: GlobeAltIcon,
      title: t('benefits.global.title'),
      description: t('benefits.global.description'),
      color: 'text-champagne',
      bgColor: 'bg-champagne/10'
    }
  ]

  return (
    <div>
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('benefits.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t('benefits.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon
          return (
            <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
              <div className={`w-16 h-16 ${benefit.bgColor} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className={`h-8 w-8 ${benefit.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">
                {benefit.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
