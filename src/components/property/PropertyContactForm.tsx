import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

interface Property {
  id: string
  title: string
  price: number
  currency: string
}

interface PropertyContactFormProps {
  property: Property
}

export default function PropertyContactForm({ property }: PropertyContactFormProps) {
  const { t } = useTranslation('property')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    preferredContact: 'email',
    scheduleViewing: false,
    requestInfo: false,
    budget: '',
    timeline: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    console.log('Form submitted:', formData)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-graphite mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-6">We've received your inquiry and will contact you within 24 hours.</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="btn-primary"
        >
          Send Another Inquiry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div>
          <h3 className="text-2xl font-semibold text-graphite mb-6">
            {t('contactForm.title')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('contactForm.description')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contactForm.name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contactForm.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('contactForm.phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('contactForm.preferredContact')}
              </label>
              <select
                name="preferredContact"
                value={formData.preferredContact}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('contactForm.message')}
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="input-field"
                placeholder={t('contactForm.messagePlaceholder')}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="scheduleViewing"
                  checked={formData.scheduleViewing}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {t('contactForm.scheduleViewing')}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="requestInfo"
                  checked={formData.requestInfo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {t('contactForm.requestInfo')}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contactForm.budget')}
                </label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 2M - 3M AED"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('contactForm.timeline')}
                </label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate</option>
                  <option value="1-3months">1-3 months</option>
                  <option value="3-6months">3-6 months</option>
                  <option value="6-12months">6-12 months</option>
                  <option value="planning">Just planning</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3"
            >
              {isSubmitting ? t('contactForm.submitting') : t('contactForm.submit')}
            </button>
          </form>
        </div>

        {/* Contact Info & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-graphite mb-4">
              {t('quickContact.title')}
            </h4>
            
            <div className="space-y-4">
              <a
                href="tel:+97141234567"
                className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <PhoneIcon className="h-5 w-5 text-champagne" />
                <div>
                  <div className="font-medium text-graphite">+971 4 123 4567</div>
                  <div className="text-sm text-gray-600">Call now</div>
                </div>
              </a>
              
              <a
                href="mailto:info@sgiprealestate.com"
                className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <EnvelopeIcon className="h-5 w-5 text-champagne" />
                <div>
                  <div className="font-medium text-graphite">info@sgiprealestate.com</div>
                  <div className="text-sm text-gray-600">Email us</div>
                </div>
              </a>
              
              <a
                href="https://wa.me/971501234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-champagne" />
                <div>
                  <div className="font-medium text-graphite">WhatsApp Chat</div>
                  <div className="text-sm text-gray-600">Quick response</div>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-champagne/5 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-graphite mb-4">
              {t('propertyInfo.title')}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium text-graphite">{property.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-champagne">
                  {formatPrice(property.price, property.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium text-graphite">#{property.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
