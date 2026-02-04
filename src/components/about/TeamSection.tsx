import { useMemo, useState, useEffect, useRef } from 'react'
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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  if (!member || !member.image) {
    return null
  }

  const imageUrl = normalizeImageUrl(member.image)
  
  // First 3 images load immediately, rest wait for scroll
  const isPriority = index < 3

  // Intersection Observer to detect when card is visible
  useEffect(() => {
    // Priority images start loading immediately
    if (isPriority) {
      setShouldLoad(true)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add small delay for animation visibility
            setTimeout(() => {
              setIsVisible(true)
            }, isPriority ? 150 : 0)
            
            if (!isPriority) {
              setShouldLoad(true)
            }
            // Disconnect observer after first intersection
            observer.disconnect()
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: isPriority ? '200px' : '50px', // Larger margin for priority images to trigger earlier
      }
    )

    // Check if element is already visible (for priority images that are above fold)
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
      
      if (isInViewport && isPriority) {
        // Element is already visible, trigger animation with delay
        setTimeout(() => {
          setIsVisible(true)
        }, 150)
      } else {
        // Use observer for scroll-triggered animation
        observer.observe(cardRef.current)
      }
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [isPriority])

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  return (
    <>
      {/* Preload critical images for instant display */}
      {isPriority && imageUrl && (
        <Head>
          <link
            rel="preload"
            as="image"
            href={imageUrl}
            fetchPriority="high"
          />
        </Head>
      )}
      <div
        ref={cardRef}
        className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="relative w-full h-[400px] bg-gray-200 overflow-hidden flex-shrink-0">
          {/* Skeleton loader with shimmer effect */}
          {(!imageLoaded || !shouldLoad) && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          )}
          
          {imageUrl && !imageError && shouldLoad ? (
            <Image
              src={imageUrl}
              alt={member.name || 'Team member'}
              width={400}
              height={533}
              className={`object-cover object-top w-full h-full transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading={isPriority ? "eager" : "lazy"}
              priority={isPriority}
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              placeholder="blur"
              blurDataURL={blurDataURL}
              fetchPriority={isPriority ? "high" : "auto"}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : imageError ? (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          ) : null}
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
      // Try to get members array directly
      const members = t('team.members', { returnObjects: true }) as any
      
      // If members is an array, return it
      if (Array.isArray(members)) {
        return members
      }
      
      // Fallback: try to get team object and extract members
      const teamObject = t('team', { returnObjects: true }) as any
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
                key={member.name || index}
                member={member}
                index={index}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
