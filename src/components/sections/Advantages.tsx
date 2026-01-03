import { useTranslation } from 'next-i18next'
import { 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  GlobeAltIcon, 
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

export default function Advantages() {
  const { t } = useTranslation('home')

  const advantages = [
    {
      icon: ShieldCheckIcon,
      title: t('advantages.trust.title'),
      description: t('advantages.trust.description'),
    },
    {
      icon: CurrencyDollarIcon,
      title: t('advantages.investment.title'),
      description: t('advantages.investment.description'),
    },
    {
      icon: GlobeAltIcon,
      title: t('advantages.global.title'),
      description: t('advantages.global.description'),
    },
    {
      icon: UserGroupIcon,
      title: t('advantages.expertise.title'),
      description: t('advantages.expertise.description'),
    },
    {
      icon: ClockIcon,
      title: t('advantages.service.title'),
      description: t('advantages.service.description'),
    },
    {
      icon: ChartBarIcon,
      title: t('advantages.market.title'),
      description: t('advantages.market.description'),
    },
  ]

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <AnimateOnScroll animation="fade-up" delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-graphite mb-4">
              {t('advantages.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('advantages.subtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((advantage, index) => (
            <AnimateOnScroll
              key={index}
              animation="fade-up"
              delay={index * 100}
            >
              <div className="card p-8 text-center group hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-champagne/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-champagne/20 transition-colors duration-300">
                <advantage.icon className="h-8 w-8 text-champagne" />
              </div>
              <h3 className="text-xl font-semibold text-graphite mb-4">
                {advantage.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {advantage.description}
              </p>
            </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
