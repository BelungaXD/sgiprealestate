import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'

export default function Refund() {
  const { t } = useTranslation('refund')
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
                    {t('introduction.scope')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('generalPolicy.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('generalPolicy.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('generalPolicy.nature')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('consultationServices.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('consultationServices.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('consultationServices.cancellation')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('consultationServices.moreThan48')}</li>
                    <li>{t('consultationServices.lessThan48')}</li>
                    <li>{t('consultationServices.noShow')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('transactionFees.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('transactionFees.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('transactionFees.completed')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('transactionFees.cancelled')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('propertyPurchases.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('propertyPurchases.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('propertyPurchases.deposit')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('propertyPurchases.contract')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('refundProcess.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('refundProcess.content')}
                  </p>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>{t('refundProcess.step1')}</li>
                    <li>{t('refundProcess.step2')}</li>
                    <li>{t('refundProcess.step3')}</li>
                    <li>{t('refundProcess.step4')}</li>
                    <li>{t('refundProcess.step5')}</li>
                  </ol>
                  <p className="text-gray-600 mb-4 mt-4">
                    {t('refundProcess.timeline')}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('nonRefundable.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('nonRefundable.content')}
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>{t('nonRefundable.completed')}</li>
                    <li>{t('nonRefundable.thirdParty')}</li>
                    <li>{t('nonRefundable.documentation')}</li>
                    <li>{t('nonRefundable.legal')}</li>
                    <li>{t('nonRefundable.marketing')}</li>
                    <li>{t('nonRefundable.digital')}</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-graphite mb-4">
                    {t('disputes.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t('disputes.content')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('disputes.resolution')}
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'refund'])),
    },
  }
}
