import { useState } from 'react'
import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
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
      <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
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
