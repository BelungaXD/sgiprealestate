import { useTranslation } from 'next-i18next'
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

export default function ContactInfo() {
  const { t } = useTranslation('contact')
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const contactMethods = [
    {
      icon: PhoneIcon,
      title: t('info.phone.title'),
      details: ['+971 4 123 4567', '+971 50 123 4567'],
      description: t('info.phone.description')
    },
    {
      icon: EnvelopeIcon,
      title: t('info.email.title'),
      details: ['info@sgipreal.com', 'sales@sgipreal.com'],
      description: t('info.email.description')
    },
    {
      icon: MapPinIcon,
      title: t('info.address.title'),
      details: ['Downtown Dubai, UAE', 'Business Bay, Dubai'],
      description: t('info.address.description')
    },
    {
      icon: ClockIcon,
      title: t('info.hours.title'),
      details: ['Mon-Fri: 9:00 AM - 7:00 PM', 'Sat: 10:00 AM - 5:00 PM'],
      description: t('info.hours.description')
    }
  ]

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: ChatBubbleLeftRightIcon,
      url: 'https://wa.me/971501234567',
      color: 'text-green-500'
    },
    {
      name: 'Website',
      icon: GlobeAltIcon,
      url: 'https://sgiprealestate.alfares.cz',
      color: 'text-champagne'
    }
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

      {/* Social Links */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-graphite mb-4">
          {t('info.social.title')}
        </h3>
        <div className="flex space-x-4">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-champagne/10 transition-colors ${social.color}`}
            >
              <social.icon className="h-6 w-6" />
            </a>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-graphite mb-4">
          {t('info.map.title')}
        </h3>
        {mapsKey ? (
          <iframe
            className="w-full h-64 rounded-lg border"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=Downtown+Dubai+UAE`}
          />
        ) : (
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Map will appear when API key is set</p>
              <p className="text-sm text-gray-400">Downtown Dubai, UAE</p>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          {t('info.emergency.title')}
        </h3>
        <p className="text-red-700 text-sm mb-3">
          {t('info.emergency.description')}
        </p>
        <a
          href="tel:+971501234567"
          className="text-red-600 font-semibold hover:text-red-800 transition-colors"
        >
          +971 50 123 4567
        </a>
      </div>
    </div>
  )
}
