import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import TeamSection from '@/components/about/TeamSection'
import CompanyValues from '@/components/about/CompanyValues'

export default function About() {
  const { t } = useTranslation('about')

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
              "@type": "Organization",
              "name": "SGIP Real Estate",
              "description": t('description'),
              "url": "https://sgiprealestate.alfares.cz",
              "logo": "https://sgiprealestate.com/logo.png",
              "foundingDate": "2014",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Dubai",
                "addressCountry": "AE"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+971-4-123-4567",
                "contactType": "customer service",
                "email": "info@sgiprealestate.com"
              },
              "sameAs": [
                "https://www.linkedin.com/company/sgip-real-estate",
                "https://www.instagram.com/sgiprealestate"
              ]
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-champagne mb-2">10+</div>
                    <div className="text-sm text-gray-200">{t('hero.yearsExperience')}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-champagne mb-2">500+</div>
                    <div className="text-sm text-gray-200">{t('hero.propertiesSold')}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-champagne mb-2">6</div>
                    <div className="text-sm text-gray-200">{t('hero.developers')}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-champagne mb-2">98%</div>
                    <div className="text-sm text-gray-200">{t('hero.clientSatisfaction')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Story */}
          <div className="container-custom py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-graphite mb-8 text-center">
                {t('story.title')}
              </h2>
              <div className="prose prose-lg mx-auto text-gray-600">
                <p className="text-xl leading-relaxed mb-6">
                  {t('story.paragraph1')}
                </p>
                <p className="text-lg leading-relaxed mb-6">
                  {t('story.paragraph2')}
                </p>
                <p className="text-lg leading-relaxed">
                  {t('story.paragraph3')}
                </p>
              </div>
            </div>
          </div>

          {/* Company Values */}
          <div className="bg-gray-50 py-16">
            <div className="container-custom">
              <CompanyValues />
            </div>
          </div>

          {/* Team Section */}
          <div className="container-custom py-16">
            <TeamSection />
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
                  className="bg-white text-champagne px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  {t('cta.contactUs')}
                </a>
                <a
                  href="/properties"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-champagne transition-colors"
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'about'])),
    },
  }
}
