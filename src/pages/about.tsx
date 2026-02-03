import { useState, useEffect } from 'react'
import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import Image from 'next/image'
import Link from 'next/link'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

export default function About() {
  const { t } = useTranslation('about')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('about-stats')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [])

  const teamMembers = [
    {
      name: 'Rustam Umurzakov',
      position: 'Founder & CEO of the company',
      image: '/uploads/team/Rustam Umurzakov.webp',
      description: 'Main competencies real estate transactions in Dubai-Moscow-Zurich, investment strategies. Successful with high experience in UAE since 2008.'
    },
    {
      name: 'Kseniya Grishina',
      position: 'Head of Market Research & Development',
      image: '/uploads/team/Kseniya Grishina.webp',
      description: 'Managing business activities aimed at innovation to improve products & services. Responsible for carrying out research in various company departments, establishing their feasibility in terms of investment.'
    },
    {
      name: 'Hussein El Reda',
      position: 'Senior Property Consultant',
      image: '/uploads/team/Hussein El Reda.webp',
      description: 'Speaks Arabic & English, leading the team in areas like: Downtown, Business Bay'
    },
    {
      name: 'Ramina Semetova',
      position: 'HR Manager',
      image: '/uploads/team/Ramina Semetova.webp',
      description: 'Responsible for individual agreements/contracts, arrange and participate in the interviews, handling all paper work for each team member.'
    },
    {
      name: 'Rushana Damini',
      position: 'Property Consultant',
      image: '/uploads/team/Rushana Damini.webp',
      description: 'Expert in property consultation with focus on client satisfaction and market expertise'
    },
    {
      name: 'Vishal Dhanak',
      position: 'Property Consultant',
      image: '/uploads/team/Vishal Dhanak.webp',
      description: 'Specialized in property investment consulting and market analysis'
    },
    {
      name: 'Yanina Dydynskaya',
      position: 'Senior Sales Consultant',
      image: '/uploads/team/Yanina Dydynskaya.webp',
      description: 'Result-oriented and self-driven leader, who achieves goals and motivate others through strong communication skills and team leadership'
    },
    {
      name: 'Anna Krotova',
      position: 'Property Specialist',
      image: '/uploads/team/Anna Krotova.webp',
      description: 'Specialist in areas: Palm Jumeirah and Dubai Marina'
    }
  ]

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
        <meta property="og:title" content={t('title')} />
        <meta property="og:description" content={t('description')} />
        <meta property="og:type" content="website" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "SGIP Real Estate",
              "description": t('description'),
              "url": "https://sgiprealestate.alfares.cz",
              "logo": "https://sgipreal.com/logo.png",
              "foundingDate": "2008",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Westburry 1, office 302",
                "addressLocality": "Business Bay",
                "addressRegion": "Dubai",
                "addressCountry": "AE"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+971-50-580-7871",
                "contactType": "customer service",
                "email": "support@sgipreal.com"
              },
              "sameAs": [
                "https://www.linkedin.com/company/sgip-real-estate",
                "https://www.instagram.com/sgiprealestate"
              ]
            })
          }}
        />
      </Head>

      <Layout>
        <div className="bg-white">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-graphite to-gray-800 text-white">
            <div className="container-custom py-16">
              <div className="max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  {t('hero.title')}
                </h1>
                <p className="text-xl text-gray-200 mb-8">
                  {t('hero.subtitle')}
                </p>
                <div id="about-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-champagne mb-2">
                      {isVisible ? (
                        <AnimatedNumber value={15} suffix="+" duration={2000} />
                      ) : (
                        <span>0+</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-200">{t('hero.yearsExperience')}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-champagne mb-2">
                      {isVisible ? (
                        <AnimatedNumber value={500} suffix="+" duration={2000} />
                      ) : (
                        <span>0+</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-200">{t('hero.propertiesSold')}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-champagne mb-2">
                      {isVisible ? (
                        <AnimatedNumber value={98} suffix="%" duration={2000} />
                      ) : (
                        <span>0%</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-200">{t('hero.clientSatisfaction')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Story */}
          <div className="container-custom py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-graphite mb-8 text-center">
                {t('story.title')}
              </h2>
              <div className="prose prose-lg mx-auto text-gray-600">
                <p className="text-xl leading-relaxed mb-6">
                  {t('story.paragraph1')}
                </p>
                <p className="text-lg leading-relaxed mb-6">
                  {t('story.paragraph2')}
                </p>
                <p className="text-lg leading-relaxed">
                  {t('story.paragraph3')}
                </p>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-gray-50 py-16">
            <div className="container-custom">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-graphite mb-4">
                  {t('team.title')}
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  {t('team.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.name}
                    className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full"
                  >
                    <div className="relative w-full h-[400px] bg-gray-200 overflow-hidden flex-shrink-0">
                      <Image
                        src={normalizeImageUrl(member.image)}
                        alt={member.name}
                        width={400}
                        height={533}
                        className="object-cover object-top w-full h-full"
                        loading={index < 2 ? "eager" : "lazy"}
                        priority={index < 2}
                        quality={70}
                        unoptimized={normalizeImageUrl(member.image).startsWith('/api/')}
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-2xl font-bold text-graphite mb-2">
                        {member.name}
                      </h3>
                      <p className="text-champagne font-semibold mb-3 text-lg">
                        {member.position}
                      </p>
                      {member.description && (
                        <p className="text-sm text-gray-600 leading-relaxed flex-grow">
                          {member.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-champagne py-16">
            <div className="container-custom text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-white text-champagne px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  {t('cta.contactUs')}
                </Link>
                <Link
                  href="/properties"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-champagne transition-colors"
                >
                  {t('cta.viewProperties')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'about'])),
    },
  }
}
