import { useTranslation } from 'next-i18next'
import type { LucideIcon } from 'lucide-react'
import { Briefcase, Building2, Home, Tag } from 'lucide-react'
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline'

const SERVICE_HEADER_ICONS: Record<string, LucideIcon> = {
  buy: Building2,
  sell: Tag,
  rent: Home,
  investment: Briefcase,
}

interface Service {
  id: string
  title: string
  titleEn: string
  description: string
  features: string[]
  process: string[]
  benefits: string[]
}

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const { t } = useTranslation('services')
  const HeaderIcon = SERVICE_HEADER_ICONS[service.id] ?? Building2

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      {/* Header */}
      <div className="bg-gradient-to-r from-champagne to-yellow-500 p-6 text-white">
        <div className="flex items-start gap-4">
          <HeaderIcon
            className="h-10 w-10 shrink-0 text-white/95"
            strokeWidth={1.25}
            aria-hidden
          />
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {service.title}
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

        {/* Benefits */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-graphite mb-4">
            {t('features.benefitsTitle')}
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
          className="w-full btn-primary flex items-center justify-center group"
        >
          {t('cta.getStarted')}
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
