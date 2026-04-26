import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useTranslation } from 'next-i18next/pages'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

export default function Footer() {
  const { t } = useTranslation('common')
  const [logoError, setLogoError] = useState(false)
  const logoSrc = process.env.NEXT_PUBLIC_LOGO_FOOTER || '/images/sgip_logo.png'
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'admin@sgipreal.com'
  const instagramUrl =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    'https://www.instagram.com/rustam_dubai'
  const youtubeUrl =
    process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://www.youtube.com/@rustamdubai'
  const linkedinUrl =
    process.env.NEXT_PUBLIC_LINKEDIN_URL ||
    'https://www.linkedin.com/in/rustam-umurzakov-74514059'

  const socialLineIconClass = 'h-5 w-5 stroke-[1.5]'

  const footerLinks = {
    company: [
      { name: t('footer.about'), href: '/about-us' },
      { name: t('footer.team'), href: '/about-us#team' },
    ],
    services: [
      { name: t('footer.buy'), href: '/services' },
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
              <div className="flex items-center mb-4">
                {logoError ? (
                  <div className="rounded-lg border border-champagne/50 bg-champagne/10 px-3 py-2">
                    <p className="text-xs font-bold tracking-[0.18em] text-champagne">
                      SGIP
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-gray-300">
                      Real Estate
                    </p>
                  </div>
                ) : (
                  <div className="relative h-16 w-16 shrink-0">
                    <Image
                      src={logoSrc}
                      alt="SGIP Real Estate"
                      width={64}
                      height={64}
                      sizes="64px"
                      className="h-16 w-16 object-contain rounded-xl"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                )}
              </div>
              <p className="text-gray-300 text-sm mb-6">
                {t('footer.description')}
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📍 Dubai, Business Bay, Westburry 1, office 302</p>
                <p>📞 +971 50 580 7871</p>
                <p>
                  ✉️{' '}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-champagne transition-colors"
                  >
                    {contactEmail}
                  </a>
                </p>
                <p className="pt-2 text-gray-400">{t('footer.followUs')}</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-champagne hover:bg-gray-600 transition-colors"
                    aria-label={t('footer.socialInstagram')}
                    title={t('footer.socialInstagram')}
                  >
                    <svg
                      className={socialLineIconClass}
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
                    className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-champagne hover:bg-gray-600 transition-colors"
                    aria-label={t('footer.socialYoutube')}
                    title={t('footer.socialYoutube')}
                  >
                    <svg
                      className={socialLineIconClass}
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
                    className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-champagne hover:bg-gray-600 transition-colors"
                    aria-label={t('footer.socialLinkedin')}
                    title={t('footer.socialLinkedin')}
                  >
                    <svg
                      className={socialLineIconClass}
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
                    className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-champagne/50 cursor-default"
                    title={t('footer.socialWebsite')}
                    aria-label={t('footer.socialWebsite')}
                    role="img"
                  >
                    <GlobeAltIcon className="h-5 w-5 stroke-[1.5]" />
                  </span>
                </div>
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
              <Link
                href="/refund"
                prefetch={false}
                className="text-gray-400 hover:text-champagne transition-colors"
              >
                {t('footer.refund')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
