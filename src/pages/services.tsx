import { useState, useEffect } from 'react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import ServiceCard from '@/components/services/ServiceCard'
import ServiceBenefits from '@/components/services/ServiceBenefits'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

export default function Services() {
  const { t } = useTranslation('services')
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

    const element = document.getElementById('services-stats')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const services = [
    {
      id: 'buy',
      title: t('buy.title'),
      titleEn: 'Buy Property',
      description: t('buy.description'),
      icon: '🏠',
      features: [
        t('buy.features.propertySearch'),
        t('buy.features.marketAnalysis'),
        t('buy.features.negotiation'),
        t('buy.features.legalSupport'),
        t('buy.features.financing'),
        t('buy.features.afterSales')
      ],
      process: [
        t('buy.process.consultation'),
        t('buy.process.search'),
        t('buy.process.viewing'),
        t('buy.process.negotiation'),
        t('buy.process.legal'),
        t('buy.process.completion')
      ],
      benefits: [
        t('buy.benefits.expertise'),
        t('buy.benefits.access'),
        t('buy.benefits.negotiation'),
        t('buy.benefits.support')
      ]
    },
    {
      id: 'sell',
      title: t('sell.title'),
      titleEn: 'Sell Property',
      description: t('sell.description'),
      icon: '💰',
      features: [
        t('sell.features.valuation'),
        t('sell.features.marketing'),
        t('sell.features.showings'),
        t('sell.features.negotiation'),
        t('sell.features.legal'),
        t('sell.features.completion')
      ],
      process: [
        t('sell.process.valuation'),
        t('sell.process.preparation'),
        t('sell.process.marketing'),
        t('sell.process.showings'),
        t('sell.process.offers'),
        t('sell.process.completion')
      ],
      benefits: [
        t('sell.benefits.maximumValue'),
        t('sell.benefits.marketing'),
        t('sell.benefits.negotiation'),
        t('sell.benefits.speed')
      ]
    },
    {
      id: 'rent',
      title: t('rent.title'),
      titleEn: 'Rent Property',
      description: t('rent.description'),
      icon: '🔑',
      features: [
        t('rent.features.search'),
        t('rent.features.viewing'),
        t('rent.features.application'),
        t('rent.features.contract'),
        t('rent.features.moveIn'),
        t('rent.features.support')
      ],
      process: [
        t('rent.process.requirements'),
        t('rent.process.search'),
        t('rent.process.viewing'),
        t('rent.process.application'),
        t('rent.process.contract'),
        t('rent.process.moveIn')
      ],
      benefits: [
        t('rent.benefits.variety'),
        t('rent.benefits.flexibility'),
        t('rent.benefits.support'),
        t('rent.benefits.quality')
      ]
    },
    {
      id: 'investment',
      title: t('investment.title'),
      titleEn: 'Investment Consultation',
      description: t('investment.description'),
      icon: '📈',
      features: [
        t('investment.features.analysis'),
        t('investment.features.strategy'),
        t('investment.features.opportunities'),
        t('investment.features.risk'),
        t('investment.features.portfolio'),
        t('investment.features.monitoring')
      ],
      process: [
        t('investment.process.assessment'),
        t('investment.process.strategy'),
        t('investment.process.research'),
        t('investment.process.selection'),
        t('investment.process.acquisition'),
        t('investment.process.management')
      ],
      benefits: [
        t('investment.benefits.expertise'),
        t('investment.benefits.opportunities'),
        t('investment.benefits.returns'),
        t('investment.benefits.management')
      ]
    }
  ]

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
        <meta property="og:title" content={t('title')} />
        <meta property="og:description" content={t('description')} />
        <meta property="og:type" content="website" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "name": t('title'),
              "description": t('description'),
              "provider": {
                "@type": "Organization",
                "name": "SGIP Real Estate",
                "url": "https://sgiprealestate.alfares.cz"
              },
              "serviceType": "Real Estate Services",
              "areaServed": ["UAE"],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Real Estate Services",
                "itemListElement": services.map(service => ({
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": service.titleEn,
                    "description": service.description
                  }
                }))
              }
            })
          }}
        />
      </Head>

      <Layout>
        <div className="bg-white">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-graphite to-gray-800 text-white">
            <div className="container-custom py-16">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  {t('hero.title')}
                </h1>
                <p className="text-xl text-gray-200 mb-8">
                  {t('hero.subtitle')}
                </p>
                <div id="services-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-champagne mb-2">
                      {isVisible ? (
                        <AnimatedNumber value={4} duration={2000} />
                      ) : (
                        <span>0</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-200">{t('hero.services')}</div>
                  </div>
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
                    <div className="text-sm text-gray-200">{t('hero.successfulTransactions')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="container-custom py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>

          {/* Service Benefits */}
          <div className="container-custom py-16">
            <ServiceBenefits />
          </div>

          {/* CTA Section */}
          <div className="bg-champagne py-16">
            <div className="container-custom text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-white text-champagne border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-champagne-dark hover:text-white hover:border-champagne-dark transition-all duration-500 ease-in-out"
                >
                  {t('cta.contactUs')}
                </a>
                <a
                  href="/properties"
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-champagne-dark transition-all duration-500 ease-in-out"
                >
                  {t('cta.viewProperties')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'services'])),
    },
  }
}
