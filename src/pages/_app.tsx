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
const CHUNK_RELOAD_MAX = 2

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
    const doChunkReload = () => {
      if (typeof window === 'undefined') return
      const count = parseInt(sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0', 10)
      if (count < CHUNK_RELOAD_MAX) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, String(count + 1))
        const sep = window.location.search ? '&' : '?'
        window.location.href = window.location.pathname + window.location.search + sep + '_t=' + Date.now()
      }
    }
    const handleError = (e: ErrorEvent) => {
      const msg = e.message || ''
      const isChunkError =
        msg.includes("Unexpected token '<'") ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk')
      if (isChunkError) doChunkReload()
    }
    const handleRejection = (e: PromiseRejectionEvent) => {
      const msg = (e.reason?.message || String(e.reason)) || ''
      const isChunkError =
        msg.includes("Unexpected token '<'") ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk')
      if (isChunkError) doChunkReload()
    }
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    // Reset reload count after successful load so next navigation gets fresh attempts
    const resetTimer = window.setTimeout(() => {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    }, 5000)
    return () => {
      window.clearTimeout(resetTimer)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
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
