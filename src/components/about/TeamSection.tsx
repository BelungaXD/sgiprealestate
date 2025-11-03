import { useTranslation } from 'next-i18next'
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  StarIcon
} from '@heroicons/react/24/outline'

interface TeamMember {
  id: string
  name: string
  nameEn: string
  position: string
  positionEn: string
  bio: string
  bioEn: string
  image: string
  email: string
  phone: string
  linkedin: string
  specialties: string[]
  experience: number
  languages: string[]
  rating: number
}

export default function TeamSection() {
  const { t, i18n } = useTranslation('about')
  const isRussian = i18n.language === 'ru'

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Александр Петров',
      nameEn: 'Alexander Petrov',
      position: 'Генеральный директор',
      positionEn: 'Chief Executive Officer',
      bio: 'Более 15 лет опыта в сфере недвижимости. Специализируется на инвестиционных стратегиях и развитии бизнеса.',
      bioEn: 'Over 15 years of experience in real estate. Specializes in investment strategies and business development.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      email: 'alexander@sgiprealestate.com',
      phone: '+971 50 123 4567',
      linkedin: 'https://linkedin.com/in/alexander-petrov',
      specialties: ['Investment Strategy', 'Business Development', 'Market Analysis'],
      experience: 15,
      languages: ['Russian', 'English', 'Arabic'],
      rating: 4.9
    },
    {
      id: '2',
      name: 'Мария Иванова',
      nameEn: 'Maria Ivanova',
      position: 'Директор по продажам',
      positionEn: 'Sales Director',
      bio: 'Эксперт по продажам элитной недвижимости с фокусом на международных клиентах.',
      bioEn: 'Expert in luxury real estate sales with focus on international clients.',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      email: 'maria@sgiprealestate.com',
      phone: '+971 50 123 4568',
      linkedin: 'https://linkedin.com/in/maria-ivanova',
      specialties: ['Luxury Sales', 'International Clients', 'Negotiation'],
      experience: 12,
      languages: ['Russian', 'English', 'French'],
      rating: 4.8
    },
    {
      id: '3',
      name: 'Дмитрий Козлов',
      nameEn: 'Dmitry Kozlov',
      position: 'Главный аналитик',
      positionEn: 'Chief Analyst',
      bio: 'Специалист по анализу рынка недвижимости и инвестиционным возможностям.',
      bioEn: 'Real estate market analysis specialist and investment opportunities expert.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      email: 'dmitry@sgiprealestate.com',
      phone: '+971 50 123 4569',
      linkedin: 'https://linkedin.com/in/dmitry-kozlov',
      specialties: ['Market Analysis', 'Investment Research', 'Data Analytics'],
      experience: 10,
      languages: ['Russian', 'English', 'German'],
      rating: 4.7
    },
    {
      id: '4',
      name: 'Анна Смирнова',
      nameEn: 'Anna Smirnova',
      position: 'Менеджер по клиентам',
      positionEn: 'Client Relations Manager',
      bio: 'Обеспечивает исключительный сервис для наших клиентов и управляет их потребностями.',
      bioEn: 'Ensures exceptional service for our clients and manages their needs.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      email: 'anna@sgiprealestate.com',
      phone: '+971 50 123 4570',
      linkedin: 'https://linkedin.com/in/anna-smirnova',
      specialties: ['Client Relations', 'Customer Service', 'Project Management'],
      experience: 8,
      languages: ['Russian', 'English', 'Spanish'],
      rating: 4.9
    }
  ]

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {teamMembers.map((member) => (
          <div key={member.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="relative">
              <img
                src={member.image}
                alt={isRussian ? member.name : member.nameEn}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-semibold text-graphite">{member.rating}</span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold text-graphite mb-1">
                {isRussian ? member.name : member.nameEn}
              </h3>
              <p className="text-champagne font-medium mb-3">
                {isRussian ? member.position : member.positionEn}
              </p>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {isRussian ? member.bio : member.bioEn}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t('team.experience')}:</span> {member.experience} {t('team.years')}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{t('team.languages')}:</span> {member.languages.join(', ')}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-graphite mb-2">{t('team.specialties')}</div>
                <div className="flex flex-wrap gap-1">
                  {member.specialties.slice(0, 2).map((specialty, index) => (
                    <span
                      key={index}
                      className="text-xs bg-champagne/10 text-champagne px-2 py-1 rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {member.specialties.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{member.specialties.length - 2}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <a
                  href={`mailto:${member.email}`}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  Email
                </a>
                <a
                  href={`tel:${member.phone}`}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  Call
                </a>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
