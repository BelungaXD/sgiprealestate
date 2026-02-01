import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'

export default function Privacy() {
  const { t } = useTranslation('privacy')

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
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('dataCollection.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('dataCollection.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('dataCollection.personalInfo')}</li>
                    <li>{t('dataCollection.contactInfo')}</li>
                    <li>{t('dataCollection.propertyPreferences')}</li>
                    <li>{t('dataCollection.websiteUsage')}</li>
                    <li>{t('dataCollection.communications')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('dataUsage.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('dataUsage.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('dataUsage.propertyServices')}</li>
                    <li>{t('dataUsage.communication')}</li>
                    <li>{t('dataUsage.marketing')}</li>
                    <li>{t('dataUsage.legalCompliance')}</li>
                    <li>{t('dataUsage.websiteImprovement')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('dataSharing.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('dataSharing.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('dataSharing.serviceProviders')}</li>
                    <li>{t('dataSharing.legalRequirements')}</li>
                    <li>{t('dataSharing.businessTransfers')}</li>
                    <li>{t('dataSharing.consent')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('dataSecurity.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('dataSecurity.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('dataSecurity.encryption')}</li>
                    <li>{t('dataSecurity.accessControl')}</li>
                    <li>{t('dataSecurity.regularAudits')}</li>
                    <li>{t('dataSecurity.staffTraining')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('yourRights.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('yourRights.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('yourRights.access')}</li>
                    <li>{t('yourRights.correction')}</li>
                    <li>{t('yourRights.deletion')}</li>
                    <li>{t('yourRights.portability')}</li>
                    <li>{t('yourRights.objection')}</li>
                    <li>{t('yourRights.withdrawal')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('cookies.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('cookies.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('cookies.essential')}</li>
                    <li>{t('cookies.analytics')}</li>
                    <li>{t('cookies.marketing')}</li>
                    <li>{t('cookies.preferences')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('dataRetention.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('dataRetention.content')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('internationalTransfers.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('internationalTransfers.content')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('children.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('children.content')}
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
                      <strong>{t('contact.email')}:</strong> support@sgipreal.com
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'privacy'])),
    },
  }
}
