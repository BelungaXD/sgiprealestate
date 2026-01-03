import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { HomeIcon } from '@heroicons/react/24/outline'

const Custom404: NextPage = () => {
  const { t } = useTranslation('common')

  return (
    <>
      <Head>
        <title>404 - {t('pageNotFound') || 'Page Not Found'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-champagne">404</h1>
            <h2 className="mt-6 text-3xl font-bold text-graphite">
              {t('pageNotFound') || 'Page Not Found'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('pageNotFoundDescription') || 'The page you are looking for does not exist.'}
            </p>
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-champagne hover:bg-champagne/90 transition-colors"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                {t('goHome') || 'Go Home'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  }
}

export default Custom404

