import { useTranslation } from 'next-i18next/pages'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'

interface Partner {
  id: string
  slug: string
  name: string
  logo: string
  website?: string
}

export default function Partners() {
  const { t, ready } = useTranslation('home')
  const [partners, setPartners] = useState<Partner[]>([])

  const fallbackPartners: Partner[] = [
    {
      id: 'emaar-properties',
      slug: 'emaar-properties',
      name: 'Emaar Properties',
      logo: '/uploads/developers/emaar_logo.png',
      website: 'https://www.emaar.com',
    },
    {
      id: 'sobha',
      slug: 'sobha',
      name: 'Sobha',
      logo: '/uploads/developers/sobha_logo.png',
      website: 'https://www.sobha.com',
    },
  ]
  const normalizedFallbackPartners = fallbackPartners.map((partner) => ({
    ...partner,
    logo: normalizeImageUrl(partner.logo),
  }))
  const fallbackBySlug = new Map(
    normalizedFallbackPartners.map((partner) => [partner.slug, partner])
  )

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const response = await fetch('/api/developers')
        const data = await response.json()
        // #region agent log
        fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bef835'},body:JSON.stringify({sessionId:'bef835',runId:'initial',hypothesisId:'H1',location:'src/components/sections/Partners.tsx:46',message:'Home partners API payload logos',data:{count:Array.isArray(data?.developers)?data.developers.length:0,sample:(Array.isArray(data?.developers)?data.developers:[]).slice(0,8).map((d:{slug?:string;logo?:string|null})=>({slug:d?.slug||'',logo:d?.logo||''}))},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        const apiPartners: Partner[] = Array.isArray(data?.developers)
          ? data.developers.map((developer: {
              id: string
              slug: string
              name: string
              nameEn?: string | null
              logo?: string | null
              website?: string | null
            }) => ({
              id: developer.id,
              slug: developer.slug,
              name: developer.nameEn || developer.name,
              logo: normalizeImageUrl(
                developer.logo || fallbackBySlug.get(developer.slug)?.logo || ''
              ),
              website: developer.website || undefined,
            }))
          : []
        // #region agent log
        fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bef835'},body:JSON.stringify({sessionId:'bef835',runId:'initial',hypothesisId:'H2',location:'src/components/sections/Partners.tsx:63',message:'Home partners normalized logo URLs',data:{count:apiPartners.length,sample:apiPartners.slice(0,8).map((p)=>({slug:p.slug,logo:p.logo}))},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        setPartners(apiPartners.length > 0 ? apiPartners : normalizedFallbackPartners)
      } catch {
        setPartners(normalizedFallbackPartners)
      }
    }

    loadPartners()
  }, [])

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <AnimateOnScroll animation="fade-up" delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-graphite mb-4">
              {t('partners.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('partners.subtitle')}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center justify-items-center max-w-6xl mx-auto mb-12">
          {partners.map((partner, index) => (
            <AnimateOnScroll
              key={partner.id}
              animation="scale-in"
              delay={index * 100}
            >
              {partner.website ? (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 bg-white rounded-lg shadow-xs hover:shadow-md transition-all duration-300 hover:scale-105 w-full h-full"
                >
                  <div className="w-full h-20 flex items-center justify-center">
                    {partner.logo ? (
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        width={120}
                        height={80}
                        sizes="(max-width: 768px) 45vw, 120px"
                        className="max-w-full max-h-full object-contain"
                        onError={() => {
                          // #region agent log
                          fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bef835'},body:JSON.stringify({sessionId:'bef835',runId:'initial',hypothesisId:'H3',location:'src/components/sections/Partners.tsx:111',message:'Home partner logo failed to load',data:{slug:partner.slug,name:partner.name,logo:partner.logo},timestamp:Date.now()})}).catch(()=>{});
                          // #endregion
                        }}
                      />
                    ) : null}
                  </div>
                </a>
              ) : (
                <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-xs hover:shadow-md transition-all duration-300 hover:scale-105 w-full h-full">
                  <div className="w-full h-20 flex items-center justify-center">
                    {partner.logo ? (
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        width={120}
                        height={80}
                        sizes="(max-width: 768px) 45vw, 120px"
                        className="max-w-full max-h-full object-contain"
                        onError={() => {
                          // #region agent log
                          fetch('http://127.0.0.1:7934/ingest/9cd6050e-5c73-4f29-afde-23295d7c65a1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'bef835'},body:JSON.stringify({sessionId:'bef835',runId:'initial',hypothesisId:'H3',location:'src/components/sections/Partners.tsx:132',message:'Home partner logo failed to load (no website)',data:{slug:partner.slug,name:partner.name,logo:partner.logo},timestamp:Date.now()})}).catch(()=>{});
                          // #endregion
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll animation="fade-up" delay={200}>
          <div className="text-center">
            <Link
              href="/developers"
              className="btn-primary inline-flex items-center group"
            >
              {ready ? t('partners.viewAllDevelopers') : 'View All Developers'}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
