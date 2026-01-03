import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'
import {
  BuildingOfficeIcon,
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'

interface Developer {
  id: string
  name: string
  nameEn: string | null
  description: string | null
  descriptionEn: string | null
  logo: string | null
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  slug: string
  _count: {
    properties: number
  }
}

interface DeveloperDetailProps {
  developer: Developer
}

export default function DeveloperDetail({ developer }: DeveloperDetailProps) {
  const { t, i18n } = useTranslation('developers')
  const router = useRouter()
  const isRussian = i18n.language === 'ru'

  const displayName = isRussian ? developer.name : (developer.nameEn || developer.name)
  const displayDescription = isRussian 
    ? (developer.description || '') 
    : (developer.descriptionEn || developer.description || '')

  const handleViewProperties = () => {
    router.push(`/properties?developer=${encodeURIComponent(displayName)}`)
  }

  return (
    <>
      <Head>
        <title>{displayName} | {t('title')} | SGIP Real Estate</title>
        <meta name="description" content={displayDescription} />
        <meta property="og:title" content={displayName} />
        <meta property="og:description" content={displayDescription} />
        <meta property="og:type" content="website" />
      </Head>

      <Layout>
        <div className="bg-white">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-graphite to-gray-800 text-white">
            <div className="container-custom py-16">
              <div className="max-w-4xl">
                <div className="flex items-start space-x-6 mb-6">
                  {developer.logo && (
                    <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <img
                        src={developer.logo}
                        alt={displayName}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                      {displayName}
                    </h1>
                    {developer.city && (
                      <div className="flex items-center text-gray-200">
                        <MapPinIcon className="h-5 w-5 mr-2" />
                        <span>{developer.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Content */}
          <div className="container-custom py-16">
            <div className="max-w-4xl">
              {/* Description */}
              {displayDescription && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-graphite mb-4">
                    {t('about') || 'About'}
                  </h2>
                  <div className="prose max-w-none text-gray-600">
                    <p className="text-lg leading-relaxed whitespace-pre-line">
                      {displayDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(developer.website || developer.email || developer.phone || developer.address) && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-graphite mb-6">
                    {t('contactInfo') || 'Contact Information'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {developer.address && (
                      <div className="flex items-start space-x-3">
                        <MapPinIcon className="h-5 w-5 text-champagne mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-graphite">{t('address') || 'Address'}</div>
                          <div className="text-gray-600">{developer.address}</div>
                        </div>
                      </div>
                    )}
                    {developer.phone && (
                      <div className="flex items-start space-x-3">
                        <PhoneIcon className="h-5 w-5 text-champagne mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-graphite">{t('phone') || 'Phone'}</div>
                          <a href={`tel:${developer.phone}`} className="text-champagne hover:underline">
                            {developer.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {developer.email && (
                      <div className="flex items-start space-x-3">
                        <EnvelopeIcon className="h-5 w-5 text-champagne mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-graphite">{t('email') || 'Email'}</div>
                          <a href={`mailto:${developer.email}`} className="text-champagne hover:underline">
                            {developer.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {developer.website && (
                      <div className="flex items-start space-x-3">
                        <GlobeAltIcon className="h-5 w-5 text-champagne mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-graphite">{t('website') || 'Website'}</div>
                          <a
                            href={developer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-champagne hover:underline"
                          >
                            {developer.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-graphite mb-6">
                  {t('statistics') || 'Statistics'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-champagne mx-auto mb-2" />
                    <div className="text-3xl font-bold text-graphite mb-1">
                      {developer._count.properties}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t('properties') || 'Properties'}
                    </div>
                  </div>
                </div>
              </div>

              {/* View Properties Button */}
              <div className="bg-champagne/10 rounded-lg p-8 text-center">
                <h3 className="text-2xl font-bold text-graphite mb-4">
                  {t('viewProperties') || 'View Properties'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t('viewPropertiesDescription') || `Explore ${developer._count.properties} properties from ${displayName}`}
                </p>
                <button
                  onClick={handleViewProperties}
                  className="btn-primary inline-flex items-center"
                >
                  <HomeIcon className="h-5 w-5 mr-2" />
                  {t('viewProperties') || 'View Properties'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params, locale, req }) => {
  try {
    const slug = params?.slug as string

    if (!slug) {
      return {
        notFound: true,
      }
    }

    // Fetch developer from API using the request host
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const fallbackHost = process.env.NEXT_PUBLIC_SITE_URL 
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host 
      : 'localhost'
    const host = req.headers.host || fallbackHost
    const baseUrl = `${protocol}://${host}`

    const response = await fetch(`${baseUrl}/api/developers/${slug}`)

    if (!response.ok) {
      return {
        notFound: true,
      }
    }

    const data = await response.json()
    const developer = data.developer

    if (!developer) {
      return {
        notFound: true,
      }
    }

    return {
      props: {
        developer,
        ...(await serverSideTranslations(locale ?? 'en', ['common', 'developers'])),
      },
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return {
      notFound: true,
    }
  }
}

