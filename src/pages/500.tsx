import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const Custom500: NextPage = () => {
  const { t } = useTranslation('common')

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <>
      <Head>
        <title>500 - {t('serverError') || 'Server Error'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-red-500">500</h1>
            <h2 className="mt-6 text-3xl font-bold text-graphite">
              {t('serverError') || 'Server Error'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('serverErrorDescription') || 'Something went wrong on our end. Please try again later.'}
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-champagne hover:bg-champagne/90 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                {t('refresh') || 'Refresh'}
              </button>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-graphite bg-white hover:bg-gray-50 transition-colors"
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

export default Custom500

