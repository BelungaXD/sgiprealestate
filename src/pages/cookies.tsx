import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'

export default function Cookies() {
  return (
    <>
      <Head>
        <title>Cookie Policy | SGIP Real Estate</title>
        <meta name="description" content="Cookie Policy for SGIP Real Estate." />
      </Head>
      <Layout>
        <div className="container-custom py-12 prose max-w-none">
          <h1>Cookie Policy</h1>
          <p>We use cookies to enhance your browsing experience, analyze site traffic, and serve targeted advertisements. You can control cookies through your browser settings.</p>
          <h2>Types of Cookies</h2>
          <ul>
            <li>Essential cookies</li>
            <li>Analytics cookies</li>
            <li>Functional cookies</li>
            <li>Advertising cookies</li>
          </ul>
          <h2>Managing Cookies</h2>
          <p>You can manage cookie preferences in your browser. Disabling cookies may affect certain features.</p>
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  }
}
