import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function Admin() {
  const { t } = useTranslation('admin')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success)
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
      <Layout>
        <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
      </Layout>
    </>
  )
}
