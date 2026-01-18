import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import Head from 'next/head'
import { useEffect } from 'react'
import { Manrope, Inter } from 'next/font/google'
import '../styles/globals.css'
import GTM from '../components/analytics/GTM'

// Optimize Google Fonts with Next.js font optimization
// This self-hosts fonts and enables proper cache headers
// Reduced font weights to minimize bundle size
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-manrope',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-inter',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
})

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Remove loading class from body when component mounts
    document.body.classList.remove('loading')
  }, [])

  return (
    <>
      <Head>
        <title>SGIP Real Estate</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#C9A86A" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <div className={`${manrope.variable} ${inter.variable}`}>
        <GTM id={process.env.NEXT_PUBLIC_GTM_ID} />
        <Component {...pageProps} />
      </div>
    </>
  )
}

export default appWithTranslation(MyApp)
