import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminDashboard from '@/components/admin/AdminDashboard'

const ADMIN_AUTH_KEY = 'sgip_admin_authenticated'

export default function Admin() {
  const { t } = useTranslation('admin')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Restore auth state from localStorage on mount (persists across reloads)
  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem(ADMIN_AUTH_KEY) === 'true'
    setIsAuthenticated(stored)
    setIsHydrated(true)
  }, [])

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success)
    if (typeof window !== 'undefined') {
      if (success) {
        localStorage.setItem(ADMIN_AUTH_KEY, 'true')
      } else {
        localStorage.removeItem(ADMIN_AUTH_KEY)
      }
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_AUTH_KEY)
    }
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
      ...(await serverSideTranslations(locale ?? 'en', ['admin', 'common'])),
    },
  }
}
