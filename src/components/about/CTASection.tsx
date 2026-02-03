import { useTranslation } from 'next-i18next'
import Link from 'next/link'

export default function CTASection() {
  const { t } = useTranslation('about-us')

  return (
    <div className="bg-champagne py-16">
      <div className="container-custom text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          {t('cta.title')}
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          {t('cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contact"
            className="bg-white text-champagne px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            {t('cta.contactUs')}
          </Link>
          <Link
            href="/properties"
            className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-champagne transition-colors"
          >
            {t('cta.viewProperties')}
          </Link>
        </div>
      </div>
    </div>
  )
}
