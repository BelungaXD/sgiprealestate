import Head from 'next/head'
import Layout from '@/components/layout/Layout'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms & Conditions | SGIP Real Estate</title>
        <meta name="description" content="Terms & Conditions for SGIP Real Estate." />
      </Head>
      <Layout>
        <div className="container-custom py-12 prose max-w-none">
          <h1>Terms & Conditions</h1>
          <p>These Terms govern your use of the SGIP Real Estate website and services. By using our site, you agree to these Terms.</p>
          <h2>Use of Website</h2>
          <p>You agree to use the site lawfully and not misuse content or services.</p>
          <h2>Liability</h2>
          <p>SGIP Real Estate is not liable for indirect or consequential damages arising from site use.</p>
        </div>
      </Layout>
    </>
  )
}


