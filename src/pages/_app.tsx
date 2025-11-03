import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import Head from 'next/head'
import { useEffect } from 'react'
import '../styles/globals.css'
import GTM from '../components/analytics/GTM'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Remove loading class from body when component mounts
    document.body.classList.remove('loading')
  }, [])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#C9A86A" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <GTM id={process.env.NEXT_PUBLIC_GTM_ID} />
      <Component {...pageProps} />
    </>
  )
}

export default appWithTranslation(MyApp)
