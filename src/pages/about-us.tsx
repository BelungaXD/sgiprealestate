import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import Layout from '@/components/layout/Layout'

// Dynamic imports with optimized loading strategies
const HeroSection = dynamic(() => import('@/components/about/HeroSection'), {
  ssr: true,
  loading: () => (
    <div className="bg-gradient-to-r from-graphite to-gray-800 text-white">
      <div className="container-custom py-16">
        <div className="max-w-4xl">
          <div className="h-12 bg-white/10 rounded mb-6 animate-pulse"></div>
          <div className="h-6 bg-white/10 rounded mb-8 w-3/4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-4 h-20 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

const StorySection = dynamic(() => import('@/components/about/StorySection'), {
  ssr: true,
  loading: () => (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto">
        <div className="h-10 bg-gray-200 rounded mb-8 w-1/3 mx-auto animate-pulse"></div>
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-4/6 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
})

const TeamSection = dynamic(() => import('@/components/about/TeamSection'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-50 py-16">
      <div className="container-custom">
        <div className="text-center mb-16">
          <div className="h-10 bg-gray-200 rounded mb-4 w-1/3 mx-auto animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-[400px] bg-gray-200"></div>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

const CTASection = dynamic(() => import('@/components/about/CTASection'), {
  ssr: true
})

export default function AboutUs() {
  const { t } = useTranslation('about-us')

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
        <meta property="og:title" content={t('title')} />
        <meta property="og:description" content={t('description')} />
        <meta property="og:type" content="website" />
      </Head>

      <Layout>
        <div className="bg-white">
          <HeroSection />
          <StorySection />
          <TeamSection />
          <CTASection />
        </div>
      </Layout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'about-us'])),
    },
  }
}
