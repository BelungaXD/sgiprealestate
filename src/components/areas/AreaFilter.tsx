import { useTranslation } from 'next-i18next'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

const HARDCODED_DEVELOPERS = [
  'Emaar Properties',
  'Sobha',
]

const LOCATION_DIRECTIONS = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
  { value: 'central', label: 'Central' },
]

interface Area {
  id: string
  name: string
  nameEn: string
  city: string
  coordinates: { lat: number; lng: number }
}

interface AreaFilterProps {
  filters: {
    developer: string[]
    location: string[]
    city: string
  }
  onFiltersChange: (filters: any) => void
  areas: Area[]
}

export default function AreaFilter({ filters, onFiltersChange, areas }: AreaFilterProps) {
  const { t, i18n } = useTranslation('areas')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [developersList, setDevelopersList] = useState<string[]>([])

  // Load developers from API
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await fetch('/api/developers')
        const data = await response.json()
        const developersFromAPI = (data.developers || [])
          .map((d: any) => d.nameEn || d.name)
          .filter((name: string) => name && name.trim() !== '')
        setDevelopersList(developersFromAPI)
      } catch (error) {
        console.error('Error fetching developers:', error)
        setDevelopersList([])
      }
    }
    fetchDevelopers()
  }, [])

  // Merge hardcoded developers with API developers
  const allDevelopersFromAPI = developersList.length > 0 ? developersList : []
  const developers = [...HARDCODED_DEVELOPERS, ...allDevelopersFromAPI.filter(d => !HARDCODED_DEVELOPERS.includes(d))]

  // Get unique cities from areas
  const cities = Array.from(new Set(areas.map(a => a.city))).filter(c => c && c.trim() !== '').sort()

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleLocationToggle = (locationValue: string) => {
    const currentLocations = filters.location || []
    const newLocations = currentLocations.includes(locationValue)
      ? currentLocations.filter(l => l !== locationValue)
      : [...currentLocations, locationValue]
    
    onFiltersChange({
      ...filters,
      location: newLocations
    })
  }

  const handleDeveloperToggle = (developerValue: string) => {
    const currentDevelopers = filters.developer || []
    const newDevelopers = currentDevelopers.includes(developerValue)
      ? currentDevelopers.filter(d => d !== developerValue)
      : [...currentDevelopers, developerValue]
    
    onFiltersChange({
      ...filters,
      developer: newDevelopers
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      developer: [],
      location: [],
      city: '',
    })
  }

  const hasActiveFilters = (filters.developer && filters.developer.length > 0) || (filters.location && filters.location.length > 0) || (filters.city !== '')

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-graphite mb-4">{title}</h3>
      {children}
    </div>
  )

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-full flex items-center justify-center space-x-2 bg-champagne text-white px-4 py-3 rounded-lg font-medium"
        >
          <FunnelIcon className="h-5 w-5" />
          <span>{t('filters') || 'Filters'}</span>
          {hasActiveFilters && (
            <span className="bg-white text-champagne rounded-full px-2 py-1 text-xs font-bold">
              {(filters.developer?.length || 0) + (filters.location?.length || 0) + (filters.city !== '' ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-graphite">{t('filters') || 'Filters'}</h2>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                {renderFilterContent()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-graphite">{t('filters') || 'Filters'}</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-champagne hover:text-champagne/80 font-medium"
              >
                {t('clearAll') || 'Clear All'}
              </button>
            )}
          </div>
          {renderFilterContent()}
        </div>
      </div>
    </>
  )

  function renderFilterContent() {
    return (
      <>
        {/* Developer - Multiple Selection */}
        <FilterSection title={t('developer') || 'Developer'}>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {developers.map(developer => {
              const isChecked = filters.developer && filters.developer.includes(developer)
              return (
                <label key={developer} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleDeveloperToggle(developer)}
                    className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{developer}</span>
                </label>
              )
            })}
          </div>
        </FilterSection>

        {/* Location Direction (North/South/East/West/Central) - Multiple Selection */}
        <FilterSection title={t('location') || 'Location'}>
          <div className="space-y-2">
            {LOCATION_DIRECTIONS.map(direction => {
              const isChecked = filters.location && filters.location.includes(direction.value)
              const label = i18n.language === 'ru' 
                ? (direction.value === 'north' ? 'Север' :
                   direction.value === 'south' ? 'Юг' :
                   direction.value === 'east' ? 'Восток' :
                   direction.value === 'west' ? 'Запад' :
                   direction.value === 'central' ? 'Центр' : direction.label)
                : i18n.language === 'ar'
                ? (direction.value === 'north' ? 'شمال' :
                   direction.value === 'south' ? 'جنوب' :
                   direction.value === 'east' ? 'شرق' :
                   direction.value === 'west' ? 'غرب' :
                   direction.value === 'central' ? 'وسط' : direction.label)
                : direction.label
              
              return (
                <label key={direction.value} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleLocationToggle(direction.value)}
                    className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              )
            })}
          </div>
        </FilterSection>

        {/* City */}
        {cities.length > 0 && (
          <FilterSection title={t('city') || 'City'}>
            <select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
            >
              <option value="">{t('allSelected') || 'All Selected'}</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </FilterSection>
        )}
      </>
    )
  }
}
