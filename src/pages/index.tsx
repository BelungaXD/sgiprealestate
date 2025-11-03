import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Script from 'next/script'
import Layout from '@/components/layout/Layout'
import Hero from '@/components/sections/Hero'
import Statistics from '@/components/sections/Statistics'
import Advantages from '@/components/sections/Advantages'
import FeaturedProperties from '@/components/sections/FeaturedProperties'
import Partners from '@/components/sections/Partners'
import CTA from '@/components/sections/CTA'

export default function Home() {
  const { t } = useTranslation('common')

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
        <meta property="og:title" content={t('title')} />
        <meta property="og:description" content={t('description')} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('title')} />
        <meta name="twitter:description" content={t('description')} />
      </Head>
      <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'SGIP Real Estate',
          url: 'https://sgiprealestate.com',
          logo: 'https://sgiprealestate.com/logo.png',
          sameAs: ['https://t.me/','https://wa.me/']
        })}
      </Script>

      <Layout>
        <Hero />
        <Statistics />
        <Advantages />
        <FeaturedProperties />
        <Partners />
        <CTA />
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'home'])),
    },
  }
}
