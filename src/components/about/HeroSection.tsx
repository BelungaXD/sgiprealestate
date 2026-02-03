import { useTranslation } from 'next-i18next'
import { useState, useEffect } from 'react'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

export default function HeroSection() {
  const { t } = useTranslation('about-us')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('about-us-hero-stats')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  return (
    <div className="bg-gradient-to-r from-graphite to-gray-800 text-white">
      <div className="container-custom py-16">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            {t('hero.subtitle')}
          </p>
          <div id="about-us-hero-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-champagne mb-2">
                {isVisible ? (
                  <AnimatedNumber value={15} suffix="+" duration={2000} />
                ) : (
                  <span>0+</span>
                )}
              </div>
              <div className="text-sm text-gray-200">{t('hero.yearsExperience')}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-champagne mb-2">
                {isVisible ? (
                  <AnimatedNumber value={500} suffix="+" duration={2000} />
                ) : (
                  <span>0+</span>
                )}
              </div>
              <div className="text-sm text-gray-200">{t('hero.propertiesSold')}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-champagne mb-2">
                {isVisible ? (
                  <AnimatedNumber value={98} suffix="%" duration={2000} />
                ) : (
                  <span>0%</span>
                )}
              </div>
              <div className="text-sm text-gray-200">{t('hero.clientSatisfaction')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
