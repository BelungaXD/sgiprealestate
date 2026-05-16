import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import Head from 'next/head'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminDashboard from '@/components/admin/AdminDashboard'

type AdminRole = 'SUPER_ADMIN' | 'MANAGER' | 'CONTENT_EDITOR'

interface SessionUser {
  id: string | null
  email: string | null
  name: string | null
  role: AdminRole
  isEnvBootstrap?: boolean
}

export default function Admin() {
  const { t } = useTranslation('admin')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [visibleTabs, setVisibleTabs] = useState<string[]>([
    'properties',
    'areas',
    'developers',
    'inquiries',
    'settings',
  ])

  const loadSession = async () => {
    try {
      const res = await fetch('/api/admin/session', { credentials: 'same-origin' })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        user?: SessionUser
        tabs?: string[]
      }
      if (res.ok && data.ok && data.user) {
        setIsAuthenticated(true)
        setSessionUser(data.user)
        setVisibleTabs(data.tabs || ['properties', 'areas'])
        return true
      }
      setIsAuthenticated(false)
      setSessionUser(null)
      return false
    } catch {
      setIsAuthenticated(false)
      setSessionUser(null)
      return false
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadSession()
      if (!cancelled) setIsHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = async (success: boolean) => {
    if (success) {
      await loadSession()
    } else {
      setIsAuthenticated(false)
      setSessionUser(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      /* still clear UI */
    }
    setIsAuthenticated(false)
    setSessionUser(null)
  }

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
          <title>{`${t('login.title')} | SGIP Real Estate`}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <AdminLogin onLogin={handleLogin} />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{`${t('dashboard.title')} | SGIP Real Estate`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminDashboard
        onLogout={handleLogout}
        sessionUser={sessionUser}
        visibleTabs={visibleTabs}
      />
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
