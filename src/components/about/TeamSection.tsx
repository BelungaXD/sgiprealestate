import { useMemo } from 'react'
import { useTranslation } from 'next-i18next'
import Head from 'next/head'
import Image from 'next/image'
import { normalizeImageUrl } from '@/lib/utils/imageUrl'

// Blur placeholder for smooth image loading
const blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='

interface TeamMemberCardProps {
  member: {
    name: string
    position: string
    image: string
    description?: string
  }
  index: number
}

function TeamMemberCard({ member, index }: TeamMemberCardProps) {
  const imageUrl = normalizeImageUrl(member.image)
  
  // First 3 images load with priority, rest use native lazy loading
  const isPriority = index < 3

  return (
    <>
      {/* Preload critical images for instant display */}
      {isPriority && (
        <Head>
          <link
            rel="preload"
            as="image"
            href={imageUrl}
            fetchPriority="high"
          />
        </Head>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
        <div className="relative w-full h-[400px] bg-gray-200 overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={member.name}
            width={400}
            height={533}
            className="object-cover object-top w-full h-full"
            loading={isPriority ? "eager" : "lazy"}
            priority={isPriority}
            quality={95}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            placeholder="blur"
            blurDataURL={blurDataURL}
            fetchPriority={isPriority ? "high" : "auto"}
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
    </>
  )
}

export default function TeamSection() {
  const { t } = useTranslation('about-us')

  // Memoize team members to avoid recalculation on every render
  const teamMembers = useMemo(() => {
    try {
      // Get team object from translations
      const teamObject = t('team', { returnObjects: true }) as any

      // Extract members array from team object
      if (teamObject && typeof teamObject === 'object' && 'members' in teamObject) {
        return Array.isArray(teamObject.members) ? teamObject.members : []
      }
      return []
    } catch (error) {
      console.error('Error loading team data:', error)
      return []
    }
  }, [t])

  return (
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

        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <TeamMemberCard
                key={member.name}
                member={member}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            {t('team.subtitle')}
          </div>
        )}
      </div>
    </div>
  )
}
