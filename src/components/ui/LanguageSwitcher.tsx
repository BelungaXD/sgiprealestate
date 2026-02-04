import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  // Avoid hydration mismatch: i18n.language can differ between server and client on first paint
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇦🇪' },
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]
  // Until mounted, show stable placeholder so server and client render the same (avoids React #418/#423)
  const displayLanguage = mounted ? currentLanguage : languages[0]

  const handleLanguageChange = (langCode: string) => {
    router.push(router.asPath, router.asPath, { locale: langCode })
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-champagne transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayLanguage.flag}</span>
        <span className="hidden sm:inline">{displayLanguage.name}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                  language.code === i18n.language ? 'text-champagne bg-champagne/10' : 'text-gray-700'
                }`}
                onClick={() => handleLanguageChange(language.code)}
              >
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
