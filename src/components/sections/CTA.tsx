import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

export default function CTA() {
  const { t } = useTranslation('home')

  return (
    <section className="section-padding bg-graphite text-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('cta.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-champagne/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneIcon className="h-8 w-8 text-champagne" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('cta.phone.title')}</h3>
            <p className="text-gray-300 mb-4">{t('cta.phone.description')}</p>
            <a
              href="tel:+97141234567"
              className="text-champagne hover:text-champagne/80 font-medium"
            >
              +971 4 123 4567
            </a>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-champagne/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="h-8 w-8 text-champagne" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('cta.email.title')}</h3>
            <p className="text-gray-300 mb-4">{t('cta.email.description')}</p>
            <a
              href="mailto:info@sgiprealestate.com"
              className="text-champagne hover:text-champagne/80 font-medium"
            >
              info@sgiprealestate.com
            </a>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-champagne/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-champagne" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('cta.whatsapp.title')}</h3>
            <p className="text-gray-300 mb-4">{t('cta.whatsapp.description')}</p>
            <a
              href="https://wa.me/971501234567"
              target="_blank"
              rel="noopener noreferrer"
              className="text-champagne hover:text-champagne/80 font-medium"
            >
              {t('cta.whatsapp.button')}
            </a>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/contact"
            className="btn-primary text-lg px-8 py-4 inline-block mr-4"
          >
            {t('cta.getQuote')}
          </Link>
          <Link
            href="/properties"
            className="btn-secondary text-lg px-8 py-4 inline-block"
          >
            {t('cta.browseProperties')}
          </Link>
        </div>
      </div>
    </section>
  )
}
