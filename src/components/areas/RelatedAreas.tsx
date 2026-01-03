import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import AreaCard from './AreaCard'

interface Area {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  city: string
  image: string
  propertiesCount: number
  averagePrice: number
  currency: string
  slug: string
  coordinates: { lat: number; lng: number }
  highlights: string[]
  amenities: string[]
}

interface RelatedAreasProps {
  currentAreaId: string
  city: string
}

export default function RelatedAreas({ currentAreaId, city }: RelatedAreasProps) {
  const { t, i18n } = useTranslation('areas')
  const currentLocale = i18n.language || 'en'

  // Load areas from API - no mock data
  const allAreas: Area[] = []

  // Filter areas by city and exclude current area
  const relatedAreas = allAreas
    .filter(area => area.city === city && area.id !== currentAreaId)
    .slice(0, 3) // Show max 3 related areas

  if (relatedAreas.length === 0) {
    return null
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('relatedAreas.title', 'Related Areas')}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('relatedAreas.description', 'Explore other premium locations in the same area')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {relatedAreas.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
      </div>
    </div>
  )
}

