import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

export default function CTA() {
  const { t } = useTranslation('home')

  return (
    <section className="section-padding bg-graphite text-white">
      <div className="container-custom">
        <AnimateOnScroll animation="fade-up" delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              {t('cta.subtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <AnimateOnScroll animation="fade-up" delay={0}>
            <div className="text-center">
            <div className="w-16 h-16 bg-champagne/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <PhoneIcon className="h-8 w-8 text-champagne" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('cta.phone.title')}</h3>
            <p className="text-gray-300 mb-4">{t('cta.phone.description')}</p>
            <a
              href="tel:+971505807871"
              className="text-champagne hover:text-champagne/80 font-medium"
            >
              +971 50 580 7871
            </a>
          </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={100}>
            <div className="text-center">
            <div className="w-16 h-16 bg-champagne/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <EnvelopeIcon className="h-8 w-8 text-champagne" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('cta.email.title')}</h3>
            <p className="text-gray-300 mb-4">{t('cta.email.description')}</p>
            <a
              href="mailto:info@sgipreal.com"
              className="text-champagne hover:text-champagne/80 font-medium"
            >
              info@sgipreal.com
            </a>
          </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={200}>
            <div className="text-center">
            <div className="w-16 h-16 bg-champagne/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-champagne" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('cta.whatsapp.title')}</h3>
            <p className="text-gray-300 mb-4">{t('cta.whatsapp.description')}</p>
            <a
              href="https://wa.me/971505807871"
              target="_blank"
              rel="noopener noreferrer"
              className="text-champagne hover:text-champagne/80 font-medium"
            >
              {t('cta.whatsapp.button')}
            </a>
          </div>
          </AnimateOnScroll>
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
