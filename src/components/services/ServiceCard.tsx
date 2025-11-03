import { useTranslation } from 'next-i18next'
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Service {
  id: string
  title: string
  titleEn: string
  description: string
  icon: string
  features: string[]
  process: string[]
  benefits: string[]
}

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { t, i18n } = useTranslation('services')
  const isRussian = i18n.language === 'ru'

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      {/* Header */}
      <div className="bg-gradient-to-r from-champagne to-yellow-500 p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{service.icon}</div>
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {isRussian ? service.title : service.titleEn}
            </h3>
            <p className="text-white/90">
              {service.description}
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-graphite mb-4">
          {t('features.title')}
        </h4>
        <ul className="space-y-2 mb-6">
          {service.features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-2">
              <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Process Steps */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-graphite mb-4">
            {t('process.title')}
          </h4>
          <div className="space-y-2">
            {service.process.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-champagne/20 rounded-full flex items-center justify-center text-xs font-bold text-champagne">
                  {index + 1}
                </div>
                <span className="text-gray-600 text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-graphite mb-4">
            {t('benefits.title')}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {service.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-champagne rounded-full"></div>
                <span className="text-gray-600 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <a
          href={`/contact?service=${service.id}`}
          className="w-full btn-primary flex items-center justify-center group-hover:bg-champagne/90 transition-colors"
        >
          {t('cta.getStarted')}
          <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  )
}
