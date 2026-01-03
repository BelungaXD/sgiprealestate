import { useTranslation } from 'next-i18next'

export default function TeamSection() {
  const { t } = useTranslation('about')

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
    </div>
  )
}
