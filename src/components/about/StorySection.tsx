import { useTranslation } from 'next-i18next'

export default function StorySection() {
  const { t } = useTranslation('about-us')
  const parasRaw = t('story.paragraphs', { returnObjects: true })
  const paragraphs = Array.isArray(parasRaw)
    ? (parasRaw as string[])
    : [t('story.body')]

  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-graphite mb-8 text-center">
          {t('story.title')}
        </h2>
        <div className="prose prose-lg mx-auto text-gray-600 space-y-6">
          {paragraphs.map((text, i) => (
            <p key={i} className="text-lg leading-relaxed">
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
