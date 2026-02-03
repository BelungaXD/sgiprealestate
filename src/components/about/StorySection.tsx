import { useTranslation } from 'next-i18next'

export default function StorySection() {
  const { t } = useTranslation('about-us')

  return (
    <div className="container-custom py-16">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-graphite mb-8 text-center">
          {t('story.title')}
        </h2>
        <div className="prose prose-lg mx-auto text-gray-600">
          <p className="text-xl leading-relaxed mb-6">
            {t('story.paragraph1')}
          </p>
          <p className="text-lg leading-relaxed mb-6">
            {t('story.paragraph2')}
          </p>
          <p className="text-lg leading-relaxed">
            {t('story.paragraph3')}
          </p>
        </div>
      </div>
    </div>
  )
}
