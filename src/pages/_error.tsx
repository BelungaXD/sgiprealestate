import { NextPageContext } from 'next'
import { NextPage } from 'next'
import { useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface ErrorProps {
  statusCode?: number
  hasGetInitialPropsRun?: boolean
  err?: Error & { statusCode?: number }
}

const Error: NextPage<ErrorProps> = ({ statusCode, hasGetInitialPropsRun, err }) => {
  useEffect(() => {
    if (!hasGetInitialPropsRun && err) {
      console.error('Error:', err)
    }
  }, [hasGetInitialPropsRun, err])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <>
      <Head>
        <title>
          {statusCode
            ? `${statusCode} - Error`
            : 'An error occurred'}
        </title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-red-500">
              {statusCode || '?'}
            </h1>
            <h2 className="mt-6 text-3xl font-bold text-graphite">
              {statusCode === 404
                ? 'Page Not Found'
                : statusCode === 500
                ? 'Server Error'
                : 'An error occurred'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {statusCode === 404
                ? 'The page you are looking for does not exist.'
                : statusCode === 500
                ? 'Something went wrong on our end. Please try again later.'
                : 'An unexpected error occurred. Please try again.'}
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-champagne hover:bg-champagne/90 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh
              </button>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-graphite bg-white hover:bg-gray-50 transition-colors"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as Error & { statusCode?: number }).statusCode : 404
  const hasGetInitialPropsRun = true

  return {
    statusCode,
    hasGetInitialPropsRun,
    err: err as Error & { statusCode?: number },
  }
}

export default Error

