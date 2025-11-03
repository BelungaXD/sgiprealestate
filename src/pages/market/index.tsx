import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'

const posts = [
  { slug: 'uae-real-estate-q1', title: 'UAE Real Estate Market — Q1 Overview', excerpt: 'Key insights and trends for Q1', date: '2025-01-31' },
]

export default function MarketIndex() {
  return (
    <>
      <Head>
        <title>Market Insights | SGIP Real Estate</title>
        <meta name="description" content="Analytics and news about UAE real estate market." />
      </Head>
      <Layout>
        <div className="container-custom py-12">
          <h1 className="text-3xl font-bold text-graphite mb-8">Market Insights</h1>
          <div className="space-y-6">
            {posts.map((p) => (
              <Link key={p.slug} href={`/market/${p.slug}`} className="block border rounded-xl p-6 bg-white hover:shadow transition">
                <div className="text-sm text-gray-500">{new Date(p.date).toLocaleDateString()}</div>
                <div className="text-xl font-semibold text-graphite mt-1">{p.title}</div>
                <div className="text-gray-600 mt-2">{p.excerpt}</div>
              </Link>
            ))}
          </div>
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return { props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) } }
}


