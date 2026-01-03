import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import Head from 'next/head'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function Hero() {
  const { t } = useTranslation('home')

  return (
    <>
      <Head>
        <link rel="preload" as="image" href="/images/hero.webp" type="image/webp" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/hero.jpg" type="image/jpeg" fetchPriority="high" />
      </Head>
    <section className="hero-bg text-white relative overflow-hidden">
        {/* Background Image - Dubai with Burj Khalifa (WebP with JPG fallback) - LCP element */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
            backgroundImage: "url('/images/hero.webp'), url('/images/hero.jpg')",
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-graphite/80 to-transparent" />
      
      <div className="container-custom relative z-10">
        <div className="py-24 md:py-32 lg:py-40">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-in text-white drop-shadow-lg">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-8 animate-slide-up drop-shadow-md">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
              <Link
                href="/properties"
                className="bg-transparent border-2 border-white/80 text-white text-lg px-8 py-4 inline-flex items-center justify-center group rounded-lg font-medium transition-all duration-200 hover:bg-white/10 hover:border-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {t('hero.exploreProperties')}
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  )
}
