import { GetStaticPaths, GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'

export default function MarketPost({ title, content, date }: { title: string; content: string; date: string }) {
  return (
    <>
      <Head>
        <title>{title} | SGIP Real Estate</title>
        <meta name="description" content={content.slice(0, 150)} />
      </Head>
      <Layout>
        <div className="container-custom py-12">
          <div className="text-sm text-gray-500">{new Date(date).toLocaleDateString()}</div>
          <h1 className="text-3xl font-bold text-graphite mt-2 mb-6">{title}</h1>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </Layout>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const slugs = ['uae-real-estate-q1']
  const paths = slugs.flatMap((slug) => (locales || ['en']).map((locale) => ({ params: { slug }, locale })))
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const slug = params?.slug as string
  const post = {
    title: 'UAE Real Estate Market — Q1 Overview',
    content: '<p>Key insights and trends for Q1 of the UAE real estate market.</p>',
    date: '2025-01-31',
  }
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
      ...post,
    },
  }
}


