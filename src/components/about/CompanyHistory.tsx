import { useTranslation } from 'next-i18next'
import { CheckIcon } from '@heroicons/react/24/outline'

export default function CompanyHistory() {
  const { t } = useTranslation('about')

  const milestones = [
    {
      year: '2008',
      title: t('history.2008.title'),
      description: t('history.2008.description'),
      achievements: [
        t('history.2008.achievement1'),
        t('history.2008.achievement2'),
        t('history.2008.achievement3')
      ]
    },
    {
      year: '2016',
      title: t('history.2016.title'),
      description: t('history.2016.description'),
      achievements: [
        t('history.2016.achievement1'),
        t('history.2016.achievement2'),
        t('history.2016.achievement3')
      ]
    },
    {
      year: '2018',
      title: t('history.2018.title'),
      description: t('history.2018.description'),
      achievements: [
        t('history.2018.achievement1'),
        t('history.2018.achievement2'),
        t('history.2018.achievement3')
      ]
    },
    {
      year: '2020',
      title: t('history.2020.title'),
      description: t('history.2020.description'),
      achievements: [
        t('history.2020.achievement1'),
        t('history.2020.achievement2'),
        t('history.2020.achievement3')
      ]
    },
    {
      year: '2022',
      title: t('history.2022.title'),
      description: t('history.2022.description'),
      achievements: [
        t('history.2022.achievement1'),
        t('history.2022.achievement2'),
        t('history.2022.achievement3')
      ]
    },
    {
      year: '2024',
      title: t('history.2024.title'),
      description: t('history.2024.description'),
      achievements: [
        t('history.2024.achievement1'),
        t('history.2024.achievement2'),
        t('history.2024.achievement3')
      ]
    }
  ]

  return (
    <div>
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-graphite mb-4">
          {t('history.title')}
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t('history.subtitle')}
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-champagne/20"></div>
        
        <div className="space-y-12">
          {milestones.map((milestone, index) => (
            <div key={milestone.year} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Content */}
              <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-2xl font-bold text-champagne mb-2">
                    {milestone.year}
                  </div>
                  <h3 className="text-xl font-semibold text-graphite mb-3">
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {milestone.description}
                  </p>
                  <ul className="space-y-2">
                    {milestone.achievements.map((achievement, achievementIndex) => (
                      <li key={achievementIndex} className="flex items-start space-x-2">
                        <CheckIcon className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Timeline dot */}
              <div className="w-2/12 flex justify-center">
                <div className="w-6 h-6 bg-champagne rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Spacer */}
              <div className="w-5/12"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
