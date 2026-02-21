import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'
import Link from 'next/link'
import { useMemo } from 'react'
import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import Layout from '@/components/layout/Layout'

export default function FAQ() {
  const { t } = useTranslation('faq')

  const categories = ['buying', 'selling', 'renting', 'ownership', 'general'] as const

  // Load all categories data with proper error handling
  const faqCategories = useMemo(() => {
    try {
      // Try to get all categories at once
      const allCategories = t('categories', { returnObjects: true }) as any

      if (allCategories && typeof allCategories === 'object' && !Array.isArray(allCategories)) {
        return categories
          .map((category) => {
            const categoryData = allCategories[category]
            if (
              categoryData &&
              typeof categoryData === 'object' &&
              !Array.isArray(categoryData) &&
              'title' in categoryData &&
              'questions' in categoryData &&
              Array.isArray(categoryData.questions) &&
              categoryData.questions.length > 0
            ) {
              return {
                key: category,
                ...categoryData,
              } as {
                key: string
                title: string
                questions: Array<{ question: string; answer: string }>
              }
            }
            return null
          })
          .filter((cat) => cat !== null) as Array<{
            key: string
            title: string
            questions: Array<{ question: string; answer: string }>
          }>
      }

      // Fallback: try to get each category individually
      return categories
        .map((category) => {
          try {
            const categoryData = t(`categories.${category}`, { returnObjects: true }) as any
            if (
              categoryData &&
              typeof categoryData === 'object' &&
              !Array.isArray(categoryData) &&
              'title' in categoryData &&
              'questions' in categoryData &&
              Array.isArray(categoryData.questions) &&
              categoryData.questions.length > 0
            ) {
              return {
                key: category,
                ...categoryData,
              } as {
                key: string
                title: string
                questions: Array<{ question: string; answer: string }>
              }
            }
          } catch (error) {
            console.error(`Error loading FAQ category ${category}:`, error)
          }
          return null
        })
        .filter((cat) => cat !== null) as Array<{
          key: string
          title: string
          questions: Array<{ question: string; answer: string }>
        }>
    } catch (error) {
      console.error('Error loading FAQ categories:', error)
      return []
    }
  }, [t])

  return (
    <>
      <Head>
        <title>{t('title')} | SGIP Real Estate</title>
        <meta name="description" content={t('description')} />
      </Head>
      <Layout>
        <div className="container-custom py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-graphite mb-4">{t('title')}</h1>
            <p className="text-lg text-gray-600 mb-12">{t('description')}</p>

            <div className="space-y-6">
              {faqCategories.map((categoryData) => (
                <div key={categoryData.key} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-graphite">{categoryData.title}</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {categoryData.questions.map((item, index) => (
                      <Disclosure key={index}>
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full justify-between items-center px-6 py-4 text-left hover:bg-gray-50 transition-colors">
                                <span className="text-base font-medium text-graphite pr-4">
                                  {item.question}
                                </span>
                                {open ? (
                                  <ChevronUpIcon className="h-5 w-5 text-champagne flex-shrink-0" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                )}
                              </Disclosure.Button>
                              <Disclosure.Panel className="px-6 py-4 text-gray-600 bg-gray-50">
                                <p className="leading-relaxed">{item.answer}</p>
                              </Disclosure.Panel>
                            </>
                          )}
                      </Disclosure>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-6">
                {t('stillHaveQuestions', { defaultValue: "Still have questions? We're here to help!" })}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-champagne hover:bg-champagne/90 transition-colors"
              >
                {t('contactUs', { defaultValue: 'Contact us' })}
              </Link>
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
      ...(await serverSideTranslations(locale ?? 'en', ['common', 'faq'])),
    },
  }
}
