import { useTranslation } from 'next-i18next'
import Image from 'next/image'

export default function TeamSection() {
  const { t } = useTranslation('about')
  const members = t('team.members', { returnObjects: true }) as Array<{
    name: string
    position: string
    image: string
    description?: string
    experience?: string
    languages?: string[]
    specialties?: string[]
  }>

  const membersArray = Array.isArray(members) ? members : []

  return (
    <div>
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('team.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t('team.subtitle')}
        </p>
      </div>

      {membersArray.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {membersArray.map((member, index) => (
            <div
              key={`${member.name}-${index}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
            >
              <div className="relative w-full h-[500px] bg-gray-200 overflow-hidden flex-shrink-0">
                {member.image && (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized={member.image.startsWith('/api/')}
                  />
                )}
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
      )}
    </div>
  )
}
