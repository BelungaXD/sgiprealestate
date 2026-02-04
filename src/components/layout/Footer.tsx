import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useTranslation } from 'next-i18next'

export default function Footer() {
  const { t } = useTranslation('common')
  const [logoError, setLogoError] = useState(false)

  const footerLinks = {
    company: [
      { name: t('footer.about'), href: '/about' },
      { name: t('footer.team'), href: '/about#team' },
      { name: t('footer.careers'), href: '/careers' },
      { name: t('footer.news'), href: '/news' },
    ],
    services: [
      { name: t('footer.buy'), href: '/properties' },
      { name: t('footer.sell'), href: '/services' },
      { name: t('footer.rent'), href: '/services' },
      { name: t('footer.investment'), href: '/services' },
    ],
    support: [
      { name: t('footer.contact'), href: '/contact' },
      { name: t('footer.faq'), href: '/faq' },
      { name: t('footer.support'), href: '/support' },
      { name: t('footer.privacy'), href: '/privacy' },
    ],
  }

  return (
    <footer className="bg-graphite text-white">
      <div className="container-custom">
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                {logoError ? (
                  <div className="w-10 h-10 bg-champagne rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                ) : (
                  <div className="relative h-10 w-10">
                    <Image
                      src="/images/sgip_logo.png"
                      alt="SGIP Real Estate"
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain rounded-lg"
                      unoptimized
                      onError={() => setLogoError(true)}
                    />
                  </div>
                )}
                <div>
                  <div className="text-xl font-bold">SGIP</div>
                  <div className="text-xs text-gray-400 -mt-1">{t('footer.companyName')}</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-6">
                {t('footer.description')}
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📍 Dubai, Business Bay, Westburry 1, office 302</p>
                <p>📞 +971 50 580 7871</p>
                <p>✉️ support@sgipreal.com</p>
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.company')}</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-gray-300 hover:text-champagne transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.services')}</h3>
              <ul className="space-y-2">
                {footerLinks.services.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-gray-300 hover:text-champagne transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.support')}</h3>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="text-gray-300 hover:text-champagne transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2026 SGIP Real Estate. {t('footer.allRightsReserved')}
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/terms"
                prefetch={false}
                className="text-gray-400 hover:text-champagne transition-colors"
              >
                {t('footer.terms')}
              </Link>
              <Link
                href="/privacy"
                prefetch={false}
                className="text-gray-400 hover:text-champagne transition-colors"
              >
                {t('footer.privacy')}
              </Link>
              <Link
                href="/cookies"
                prefetch={false}
                className="text-gray-400 hover:text-champagne transition-colors"
              >
                {t('footer.cookies')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
