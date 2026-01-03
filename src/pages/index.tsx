import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Script from 'next/script'
import dynamic from 'next/dynamic'
import Layout from '@/components/layout/Layout'
import Hero from '@/components/sections/Hero'
import { prisma } from '@/lib/prisma'

// Lazy load components below the fold for better performance
const Statistics = dynamic(() => import('@/components/sections/Statistics'), {
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})
const Advantages = dynamic(() => import('@/components/sections/Advantages'), {
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})
const FeaturedProperties = dynamic(() => import('@/components/sections/FeaturedProperties'), {
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})
const Partners = dynamic(() => import('@/components/sections/Partners'), {
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})
const CTA = dynamic(() => import('@/components/sections/CTA'), {
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})

interface HomeProps {
  featuredProperties: any[]
}

export default function Home({ featuredProperties }: HomeProps) {
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
        <link rel="preload" as="image" href="/images/hero.webp" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/hero.jpg" fetchPriority="high" />
      </Head>
      <Script
        id="ld-org"
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'SGIP Real Estate',
          url: 'https://sgiprealestate.com',
          logo: 'https://sgiprealestate.com/logo.png',
          sameAs: ['https://t.me/','https://wa.me/']
          })
        }}
      />

      <Layout>
        <Hero />
        <div id="statistics-section">
          <Statistics />
        </div>
        <Advantages />
        <FeaturedProperties initialProperties={featuredProperties} />
        <Partners />
        <CTA />
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  let featuredProperties: any[] = []

  // Fetch featured properties from database if available
  if (process.env.DATABASE_URL) {
    try {
      const properties = await prisma.property.findMany({
        where: {
          isPublished: true,
          isFeatured: true,
        },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          area: {
            select: {
              name: true,
              nameEn: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      })

      featuredProperties = properties.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description || '',
        price: p.price,
        currency: p.currency,
        type: p.type,
        area: p.areaSqm,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        location: `${p.city}, ${p.district}`,
        image: p.images && p.images.length > 0 ? p.images[0].url : '/images/placeholder.jpg',
      }))
    } catch (error) {
      console.error('Error fetching featured properties:', error)
      featuredProperties = []
    }
  }

  return {
    props: {
      featuredProperties,
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'home'])),
    },
    revalidate: 60, // Revalidate every 60 seconds
  }
}
