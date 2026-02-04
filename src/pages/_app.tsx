import type { AppProps } from 'next/app'
import { appWithTranslation } from 'next-i18next'
import Head from 'next/head'
import { useEffect } from 'react'
import { Manrope, Inter } from 'next/font/google'
import '../styles/globals.css'
import GTM from '../components/analytics/GTM'

// Optimize Google Fonts with Next.js font optimization
// This self-hosts fonts and enables proper cache headers
const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-manrope',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

const CHUNK_RELOAD_KEY = 'chunk-reload-attempted'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Remove loading class from body when component mounts
    document.body.classList.remove('loading')
    // Apply font variables to html element for global access
    document.documentElement.classList.add(manrope.variable, inter.variable)
  }, [])

  useEffect(() => {
    // Recover from "Unexpected token '<'" - happens when chunk request returns HTML (404) instead of JS.
    // Cache-busting redirect forces a fresh document load so new HTML (with correct chunk URLs) is fetched.
    const handleError = (e: ErrorEvent) => {
      const msg = e.message || ''
      const isChunkError =
        msg.includes("Unexpected token '<'") ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk')
      if (isChunkError && typeof window !== 'undefined') {
        const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY)
        if (!alreadyReloaded) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
          const sep = window.location.search ? '&' : '?'
          window.location.href = window.location.pathname + window.location.search + sep + '_t=' + Date.now()
        }
      }
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  return (
    <>
      <Head>
        <title>SGIP Real Estate</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#C9A86A" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <div className={`${manrope.variable} ${inter.variable} font-sans`}>
        <GTM id={process.env.NEXT_PUBLIC_GTM_ID} />
        <Component {...pageProps} />
      </div>
    </>
  )
}

export default appWithTranslation(MyApp)
