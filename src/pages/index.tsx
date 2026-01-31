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
// Disable SSR for components that don't need it to reduce initial bundle size
const Statistics = dynamic(() => import('@/components/sections/Statistics'), {
  ssr: true,
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})
const Advantages = dynamic(() => import('@/components/sections/Advantages'), {
  ssr: true,
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})
const FeaturedProperties = dynamic(() => import('@/components/sections/FeaturedProperties'), {
  ssr: true,
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})
const Partners = dynamic(() => import('@/components/sections/Partners'), {
  ssr: false,
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})
const CTA = dynamic(() => import('@/components/sections/CTA'), {
  ssr: false,
  loading: () => <div className="section-padding bg-white"><div className="container-custom"><div className="h-64" /></div></div>,
})

interface HomeProps {
  featuredProperties: any[]
}

export default function Home({ featuredProperties }: HomeProps) {
  const { t } = useTranslation(['common', 'home'])

  return (
    <>
      <Head>
        <title>{t('home:title')} | SGIP Real Estate</title>
        <meta name="description" content={t('home:description')} />
        <meta property="og:title" content={t('home:title')} />
        <meta property="og:description" content={t('home:description')} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('home:title')} />
        <meta name="twitter:description" content={t('home:description')} />
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
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sgipreal.com',
            logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sgipreal.com'}/images/sgip_logo.png`,
            ...(process.env.NEXT_PUBLIC_TELEGRAM_USERNAME || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? {
              sameAs: [
                ...(process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ? [`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_USERNAME}`] : []),
                ...(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? [`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`] : [])
              ]
            } : {})
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
        image: p.images && p.images.length > 0 ? p.images[0].url : '/images/hero.jpg',
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
