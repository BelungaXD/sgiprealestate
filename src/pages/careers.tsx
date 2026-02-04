import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'

export default function Careers() {
  const { t } = useTranslation('careers')

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
      </Head>
      <Layout>
        <div className="container-custom py-12">
          <h1 className="text-3xl font-bold text-graphite mb-4">{t('title')}</h1>
          <p className="text-gray-600 mb-8">{t('description')}</p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-champagne hover:bg-champagne/90"
          >
            Contact us
          </Link>
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'careers'])),
    },
  }
}
