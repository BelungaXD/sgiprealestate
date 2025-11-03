import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('common')
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  const telegramUsername = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME
  const message = encodeURIComponent(t('whatsapp.message'))

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${message}`
    : (typeof window !== 'undefined' ? `/${document.documentElement.lang || 'en'}/contact` : '/contact')
  const telegramHref = telegramUsername
    ? `https://t.me/${telegramUsername}`
    : (typeof window !== 'undefined' ? `/${document.documentElement.lang || 'en'}/contact` : '/contact')

  return (
    <>
      {/* Floating WhatsApp Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-champagne hover:bg-champagne/90 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Open messenger widget"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* WhatsApp Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)} />
            
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('whatsapp.title')}
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setIsOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6">
                    {t('whatsapp.description')}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={whatsappHref}
                      target={whatsappNumber ? '_blank' : undefined}
                      rel={whatsappNumber ? 'noopener noreferrer' : undefined}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-center"
                    >
                      {t('whatsapp.openChat')}
                    </a>
                    <a
                      href={telegramHref}
                      target={telegramUsername ? '_blank' : undefined}
                      rel={telegramUsername ? 'noopener noreferrer' : undefined}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-center"
                    >
                      Telegram
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
