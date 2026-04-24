import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import defaultHeaderLogo from '../../../public/images/sgip_logo.png'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const { t } = useTranslation('common')
  const router = useRouter()
  const logoSrc = process.env.NEXT_PUBLIC_LOGO_HEADER || defaultHeaderLogo
  // WhatsApp chat button removed per request

  const navigation = router.locale === 'ru'
    ? [
        { name: t('nav.home'), href: '/' },
        { name: t('nav.properties'), href: '/properties' },
        { name: t('nav.areas'), href: '/areas' },
        { name: t('nav.developers'), href: '/developers' },
        { name: t('nav.services'), href: '/services' },
        { name: t('nav.aboutUs'), href: '/about-us' },
        { name: t('nav.contact'), href: '/contact' },
      ]
    : [
        { name: t('nav.home'), href: '/' },
        { name: t('nav.properties'), href: '/properties' },
        { name: t('nav.areas'), href: '/areas' },
        { name: t('nav.developers'), href: '/developers' },
        { name: t('nav.services'), href: '/services' },
        { name: t('nav.aboutUs'), href: '/about-us' },
        { name: t('nav.contact'), href: '/contact' },
      ]

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/'
    }
    return router.pathname.startsWith(href)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40 transition-shadow duration-300">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            {logoError ? (
              <div className="rounded-lg border border-champagne/50 bg-champagne/10 px-2 py-1.5 transition-transform duration-300 group-hover:scale-105">
                <p className="text-[10px] font-bold tracking-[0.14em] text-champagne">
                  SGIP
                </p>
                <p className="text-[9px] uppercase tracking-[0.08em] text-graphite/80">
                  Real Estate
                </p>
              </div>
            ) : (
              <div className="relative h-16 w-16 flex-shrink-0">
                <Image
                  src={logoSrc}
                  alt="SGIP Real Estate"
                  width={64}
                  height={64}
                  sizes="64px"
                  className="h-14 w-14 object-contain rounded-xl mx-auto"
                  priority
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                locale={router.locale}
                className={`nav-link whitespace-nowrap ${
                  isActive(item.href) ? 'nav-link-active' : ''
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA and Language Switcher */}
          <div className="hidden lg:flex items-center space-x-4">
            <LanguageSwitcher />
            <Link
              href="/contact"
              locale={router.locale}
              className="btn-primary text-sm px-4 py-2"
            >
              {t('nav.getQuote')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <LanguageSwitcher />
            <button
              type="button"
              className="p-2 text-gray-700 hover:text-champagne"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={t('nav.toggleMenu')}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <nav className="py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-2 text-base font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'text-champagne bg-champagne/10'
                      : 'text-gray-700 hover:text-champagne hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-2 px-4">
                <Link
                  href="/contact"
                  locale={router.locale}
                  className="block w-full text-center btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('nav.getQuote')}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
