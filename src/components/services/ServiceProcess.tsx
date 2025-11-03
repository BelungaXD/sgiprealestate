import { useTranslation } from 'next-i18next'
import { CheckIcon } from '@heroicons/react/24/outline'

interface Service {
  id: string
  title: string
  titleEn: string
  process: string[]
}

interface ServiceProcessProps {
  services: Service[]
}

export default function ServiceProcess({ services }: ServiceProcessProps) {
  const { t, i18n } = useTranslation('services')
  const isRussian = i18n.language === 'ru'

  return (
    <div>
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('process.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t('process.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-graphite mb-6 text-center">
              {isRussian ? service.title : service.titleEn}
            </h3>
            <div className="space-y-4">
              {service.process.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-champagne/20 rounded-full flex items-center justify-center text-xs font-bold text-champagne flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-gray-600 text-sm">{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
