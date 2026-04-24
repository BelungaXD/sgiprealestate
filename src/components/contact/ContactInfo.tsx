import { useTranslation } from 'next-i18next/pages'
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

const svgLine = 'stroke-[1.5]'

export default function ContactInfo() {
  const { t } = useTranslation('contact')
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'admin@sgipreal.com'
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971505807871'
  const whatsappHref = `https://wa.me/${whatsappNumber}`
  const telegramHref =
    process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/+971505807871'
  const instagramUrl =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    'https://www.instagram.com/rustam_dubai'
  const youtubeUrl =
    process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://www.youtube.com/@rustamdubai'
  const linkedinUrl =
    process.env.NEXT_PUBLIC_LINKEDIN_URL ||
    'https://www.linkedin.com/in/rustam-umurzakov-74514059'
  const emailRu =
    process.env.NEXT_PUBLIC_EMAIL_RU || 'ru@sgipreal.com'
  const emailAlex =
    process.env.NEXT_PUBLIC_EMAIL_ALEX || 'alex@sgipreal.com'
  const emailElza =
    process.env.NEXT_PUBLIC_EMAIL_ELZA || 'elza@sgipreal.com'

  const contactMethods = [
    {
      icon: PhoneIcon,
      title: t('info.phone.title'),
      details: ['+971 50 580 7871'],
      description: t('info.phone.description'),
    },
    {
      icon: EnvelopeIcon,
      title: t('info.email.title'),
      details: [contactEmail],
      description: t('info.email.description'),
    },
    {
      icon: MapPinIcon,
      title: t('info.address.title'),
      details: ['Dubai, Business Bay, Westburry 1, office 302'],
      description: t('info.address.description'),
    },
    {
      icon: ClockIcon,
      title: t('info.hours.title'),
      details: ['Mon-Fri: 9:00 AM - 7:00 PM', 'Sat: 10:00 AM - 5:00 PM'],
      description: t('info.hours.description'),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-graphite mb-6">
          {t('info.title')}
        </h2>
        <p className="text-gray-600 mb-8">
          {t('info.description')}
        </p>
      </div>

      {/* Contact Methods */}
      <div className="space-y-6">
        {contactMethods.map((method, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-champagne/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <method.icon className="h-6 w-6 text-champagne" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-graphite mb-2">
                {method.title}
              </h3>
              <div className="space-y-1 mb-2">
                {method.details.map((detail, detailIndex) => (
                  <div key={detailIndex} className="text-gray-700 font-medium">
                    {detail}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                {method.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-graphite mb-2">
          {t('info.messengers.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('info.messengers.body')}{' '}
          <span className="font-semibold text-graphite tabular-nums">
            0505807871
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            {t('social.whatsapp')}
          </a>
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            {t('social.telegram')}
          </a>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-graphite mb-4">
          {t('info.teamEmails.title')}
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <span className="text-gray-500">{t('info.teamEmails.ru')}: </span>
            <a
              href={`mailto:${emailRu}`}
              className="font-medium text-champagne hover:underline"
            >
              {emailRu}
            </a>
          </li>
          <li>
            <span className="text-gray-500">{t('info.teamEmails.alex')}: </span>
            <a
              href={`mailto:${emailAlex}`}
              className="font-medium text-champagne hover:underline"
            >
              {emailAlex}
            </a>
          </li>
          <li>
            <span className="text-gray-500">{t('info.teamEmails.elza')}: </span>
            <a
              href={`mailto:${emailElza}`}
              className="font-medium text-champagne hover:underline"
            >
              {emailElza}
            </a>
          </li>
        </ul>
      </div>

      {/* Social Links */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-graphite mb-4">
          {t('info.social.title')}
        </h3>
        <div className="flex flex-wrap gap-3">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-champagne/10 transition-colors text-graphite"
            aria-label={t('social.instagram')}
            title={t('social.instagram')}
          >
            <svg
              className={`h-6 w-6 ${svgLine}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <path d="M17.5 6.5h.01" strokeLinecap="round" />
            </svg>
          </a>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-champagne/10 transition-colors text-graphite"
            aria-label={t('social.youtube')}
            title={t('social.youtube')}
          >
            <svg
              className={`h-6 w-6 ${svgLine}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9.75C3 8.25 3.75 7.25 5.5 7c1.5-.25 6.5-.25 6.5-.25s5 0 6.5.25c1.75.25 2.5 1.25 2.5 2.75v4.5c0 1.5-.75 2.5-2.5 2.75-1.5.25-6.5.25-6.5.25s-5 0-6.5-.25C3.75 16.75 3 15.75 3 14.25v-4.5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 9.75 14.5 12 10 14.25v-4.5z"
              />
            </svg>
          </a>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-champagne/10 transition-colors text-graphite"
            aria-label={t('social.linkedin')}
            title={t('social.linkedin')}
          >
            <svg
              className={`h-6 w-6 ${svgLine}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"
              />
              <rect width="4" height="12" x="2" y="9" rx="1" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <span
            className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-graphite/70 cursor-default"
            title={t('social.website')}
            aria-label={t('social.website')}
            role="img"
          >
            <GlobeAltIcon className={`h-6 w-6 ${svgLine}`} />
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-graphite mb-4">
          {t('info.map.title')}
        </h3>
        <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <iframe
            className="w-full h-full"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=25.1972,55.2684&hl=en&z=16&output=embed"
            title="SGIP Real Estate Location - Dubai, Business Bay, Westburry 1, office 302"
          />
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Dubai, Business Bay, Westburry 1, office 302</p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=25.1972,55.2684"
            target="_blank"
            rel="noopener noreferrer"
            className="text-champagne hover:text-champagne-dark text-sm font-medium inline-flex items-center transition-colors"
          >
            <MapPinIcon className="h-4 w-4 mr-1" />
            {t('info.map.openInMaps') || 'Open in Google Maps'}
          </a>
        </div>
      </div>
    </div>
  )
}
