import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

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
      <div className="text-center py-12 bg-gradient-to-br from-green-50 to-white rounded-xl p-12 border border-green-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-graphite mb-3">Thank You!</h3>
        <p className="text-gray-600 mb-8 text-lg">We've received your inquiry and will contact you within 24 hours.</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="btn-primary px-8 py-3 inline-flex items-center group"
        >
          Send Another Inquiry
          <ArrowRightIcon className="ml-2 h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-8 border border-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
              className="w-full btn-primary text-lg px-8 py-4 inline-flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('contactForm.submitting')}
                </span>
              ) : (
                <>
                  {t('contactForm.submit')}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar - Property Info & Fast Response */}
        <div className="space-y-6">
          {/* Property Info Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
            <h4 className="text-lg font-bold text-graphite mb-5 flex items-center">
              <div className="w-1 h-6 bg-champagne rounded-full mr-3 transition-all duration-300 group-hover:h-8"></div>
              {t('propertyInfo.title')}
            </h4>
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100 transition-all duration-300 group-hover:border-champagne/30">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1 font-semibold">PROPERTY</div>
                <div className="font-bold text-graphite text-base">{property.title}</div>
              </div>
              <div className="pb-3 border-b border-gray-100 transition-all duration-300 group-hover:border-champagne/30">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1 font-semibold">PRICE</div>
                <div className="font-bold text-xl text-champagne transition-colors duration-300 group-hover:text-champagne-dark">
                  {formatPrice(property.price, property.currency)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1 font-semibold">REFERENCE</div>
                <div className="font-semibold text-graphite text-base font-mono">#{property.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* Response Time Card */}
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border border-green-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-green-200 group-hover:scale-110">
                <svg className="w-6 h-6 text-green-600 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h5 className="font-bold text-graphite mb-1 transition-colors duration-300 group-hover:text-green-700">Fast Response</h5>
                <p className="text-sm text-gray-600">We typically respond within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
