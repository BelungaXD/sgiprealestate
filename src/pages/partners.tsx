import { GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'

const partners = [
  { name: 'Emirates NBD', type: 'BANK', logo: '/images/partners/enbd.png', website: 'https://www.emiratesnbd.com/' },
  { name: 'ADCB', type: 'BANK', logo: '/images/partners/adcb.png', website: 'https://www.adcb.com/' },
  { name: 'Allianz', type: 'INSURANCE', logo: '/images/partners/allianz.png', website: 'https://www.allianz.com/' },
]

export default function PartnersPage() {
  const { t } = useTranslation('common')
  return (
    <>
      <Head>
        <title>Partners | SGIP Real Estate</title>
        <meta name="description" content="Our trusted partners in banking, insurance, and consulting." />
      </Head>
      <Layout>
        <div className="container-custom py-12">
          <h1 className="text-3xl font-bold text-graphite mb-8">{t('footer.services')} - Partners</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((p) => (
              <a key={p.name} href={p.website} target="_blank" rel="noopener noreferrer" className="group border rounded-xl p-6 bg-white hover:shadow transition">
                <div className="h-16 flex items-center justify-center mb-4">
                  <img src={p.logo} alt={p.name} className="max-h-16 object-contain" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-graphite group-hover:text-champagne">{p.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{p.type}</div>
                </div>
              </a>
            ))}
          </div>
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


