import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'

export default function Cookies() {
  const { t } = useTranslation('cookies')
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'admin@sgipreal.com'

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
      </Head>
      <Layout>
        <div className="bg-white">
          <div className="container-custom py-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-graphite mb-8">
                {t('title')}
              </h1>

              <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-8">
                  {t('lastUpdated')}: {t('lastUpdatedDate')}
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('introduction.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('introduction.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('introduction.purpose')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('whatAreCookies.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('whatAreCookies.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('whatAreCookies.types')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('typesOfCookies.title')}
                  </h2>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-graphite mb-3">
                      {t('typesOfCookies.essential.title')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('typesOfCookies.essential.content')}
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>{t('typesOfCookies.essential.session')}</li>
                      <li>{t('typesOfCookies.essential.security')}</li>
                      <li>{t('typesOfCookies.essential.preferences')}</li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-graphite mb-3">
                      {t('typesOfCookies.analytics.title')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('typesOfCookies.analytics.content')}
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>{t('typesOfCookies.analytics.visitors')}</li>
                      <li>{t('typesOfCookies.analytics.behavior')}</li>
                      <li>{t('typesOfCookies.analytics.performance')}</li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-graphite mb-4">
                      {t('typesOfCookies.functional.title')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('typesOfCookies.functional.content')}
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>{t('typesOfCookies.functional.language')}</li>
                      <li>{t('typesOfCookies.functional.remember')}</li>
                      <li>{t('typesOfCookies.functional.customization')}</li>
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-graphite mb-3">
                      {t('typesOfCookies.marketing.title')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('typesOfCookies.marketing.content')}
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>{t('typesOfCookies.marketing.targeting')}</li>
                      <li>{t('typesOfCookies.marketing.retargeting')}</li>
                      <li>{t('typesOfCookies.marketing.measurement')}</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('thirdPartyCookies.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('thirdPartyCookies.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li><strong>Google Analytics:</strong> {t('thirdPartyCookies.googleAnalytics')}</li>
                    <li><strong>Google Tag Manager:</strong> {t('thirdPartyCookies.googleTagManager')}</li>
                    <li><strong>Yandex Metrica:</strong> {t('thirdPartyCookies.yandexMetrica')}</li>
                    <li><strong>Google Maps:</strong> {t('thirdPartyCookies.googleMaps')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('managingCookies.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('managingCookies.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('managingCookies.browser')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('managingCookies.impact')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('cookieConsent.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('cookieConsent.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('cookieConsent.withdrawal')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('retention.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('retention.content')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('updates.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('updates.content')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('contact.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('contact.content')}
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 mb-2">
                      <strong>{t('contact.email')}:</strong> {contactEmail}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong>{t('contact.phone')}:</strong> +971 50 580 7871
                    </p>
                    <p className="text-gray-700">
                      <strong>{t('contact.address')}:</strong> Dubai, Business Bay, Westburry 1, office 302
                    </p>
                  </div>
                </section>
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'cookies'])),
    },
  }
}
