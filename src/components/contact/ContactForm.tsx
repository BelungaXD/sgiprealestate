import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function ContactForm() {
  const { t } = useTranslation('contact')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    preferredContact: 'email',
    propertyInterest: '',
    budget: '',
    timeline: '',
    consent: false
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
    if (!formData.consent) {
      return
    }
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    console.log('Contact form submitted:', formData)
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-graphite mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-6">{t('form.successMessage')}</p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="btn-primary"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-graphite mb-6">
        {t('form.title')}
      </h2>
      <p className="text-gray-600 mb-8">
        {t('form.description')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.name')} *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.email')} *
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            id="consent"
            type="checkbox"
            name="consent"
            checked={Boolean(formData.consent)}
            onChange={handleInputChange}
            required
            className="mt-1 h-4 w-4 rounded border-gray-300 text-champagne focus:ring-champagne"
          />
          <label htmlFor="consent" className="text-sm text-gray-600">
            {t('form.consent')}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.phone')}
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.subject')} *
          </label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
            className="input-field"
          >
            <option value="">{t('form.selectSubject')}</option>
            <option value="buy">{t('form.subjects.buy')}</option>
            <option value="sell">{t('form.subjects.sell')}</option>
            <option value="rent">{t('form.subjects.rent')}</option>
            <option value="investment">{t('form.subjects.investment')}</option>
            <option value="general">{t('form.subjects.general')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.message')} *
          </label>
          <div className="relative">
            <ChatBubbleLeftRightIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={4}
              className="input-field pl-10"
              placeholder={t('form.messagePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('form.preferredContact')}
          </label>
          <select
            name="preferredContact"
            value={formData.preferredContact}
            onChange={handleInputChange}
            className="input-field"
          >
            <option value="email">{t('form.email')}</option>
            <option value="phone">{t('form.phone')}</option>
            <option value="whatsapp">{t('form.whatsapp')}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.propertyInterest')}
            </label>
            <input
              type="text"
              name="propertyInterest"
              value={formData.propertyInterest}
              onChange={handleInputChange}
              className="input-field"
              placeholder={t('form.propertyInterestPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('form.budget')}
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
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary py-3"
        >
          {isSubmitting ? t('form.submitting') : t('form.submit')}
        </button>
      </form>
    </div>
  )
}
