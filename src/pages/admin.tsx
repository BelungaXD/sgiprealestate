import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function Admin() {
  const { t } = useTranslation('admin')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/session', { credentials: 'same-origin' })
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
        if (!cancelled && res.ok && data.ok) {
          setIsAuthenticated(true)
        }
      } catch {
        /* session check failed — stay logged out */
      } finally {
        if (!cancelled) setIsHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      /* still clear UI */
    }
    setIsAuthenticated(false)
  }

  // Avoid flash of login form before hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>{t('login.title')} | SGIP Real Estate</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <AdminLogin onLogin={handleLogin} />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{t('dashboard.title')} | SGIP Real Estate</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminDashboard onLogout={handleLogout} />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['admin', 'common', 'downtown', 'the-oasis'])),
    },
  }
}
