import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'

export default function Terms() {
  const { t } = useTranslation('terms')
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
                    {t('introduction.agreement')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('definitions.title')}
                  </h2>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li><strong>{t('definitions.company')}</strong> {t('definitions.companyDesc')}</li>
                    <li><strong>{t('definitions.website')}</strong> {t('definitions.websiteDesc')}</li>
                    <li><strong>{t('definitions.services')}</strong> {t('definitions.servicesDesc')}</li>
                    <li><strong>{t('definitions.user')}</strong> {t('definitions.userDesc')}</li>
                    <li><strong>{t('definitions.client')}</strong> {t('definitions.clientDesc')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('acceptance.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('acceptance.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('acceptance.minimumAge')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('services.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('services.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('services.buy')}</li>
                    <li>{t('services.sell')}</li>
                    <li>{t('services.rent')}</li>
                    <li>{t('services.management')}</li>
                    <li>{t('services.investment')}</li>
                    <li>{t('services.mortgage')}</li>
                    <li>{t('services.business')}</li>
                  </ul>
                  <p className="text-gray-600 mb-4 mt-4">
                    {t('services.disclaimer')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('userObligations.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('userObligations.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('userObligations.accurate')}</li>
                    <li>{t('userObligations.lawful')}</li>
                    <li>{t('userObligations.noFraud')}</li>
                    <li>{t('userObligations.noUnauthorized')}</li>
                    <li>{t('userObligations.respect')}</li>
                    <li>{t('userObligations.compliance')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('propertyListings.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('propertyListings.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('propertyListings.accuracy')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('propertyListings.availability')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('fees.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('fees.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('fees.transparency')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('fees.payment')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('intellectualProperty.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('intellectualProperty.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('intellectualProperty.restrictions')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('liability.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('liability.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('liability.limitation')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('liability.exclusions')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('indemnification.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('indemnification.content')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('termination.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('termination.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('termination.effects')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('governingLaw.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('governingLaw.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('governingLaw.jurisdiction')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('disputeResolution.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('disputeResolution.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('disputeResolution.mediation')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('disputeResolution.arbitration')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('changes.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('changes.content')}
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'terms'])),
    },
  }
}
