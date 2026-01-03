import { useTranslation } from 'next-i18next'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

interface Property {
  id: string
  type: string
  district: string
  developer: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  yearBuilt: number
}

interface PropertyFilterProps {
  filters: {
    type: string
    district: string
    developer: string
    minPrice: string
    maxPrice: string
    bedrooms: string
    bathrooms: string
    minArea: string
    maxArea: string
    yearBuilt: string
    completionDate: string
  }
  onFiltersChange: (filters: any) => void
  properties: Property[]
}

export default function PropertyFilter({ filters, onFiltersChange, properties }: PropertyFilterProps) {
  const { t } = useTranslation('properties')
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
        // Fallback to developers from properties
        const developersFromProperties = Array.from(new Set(properties.map(p => p.developer))).filter(d => d && d.trim() !== '')
        setDevelopersList(developersFromProperties)
      }
    }
    fetchDevelopers()
  }, [properties])

  // Get unique values for filter options
  const propertyTypes = [...new Set(properties.map(p => p.type))].sort()
  const districts = [...new Set(properties.map(p => p.district))].sort()
  // Use developers from API, fallback to properties if API fails
  const developers = developersList.length > 0 ? developersList : [...new Set(properties.map(p => p.developer))].filter(d => d && d.trim() !== '').sort()
  const maxPrice = Math.max(...properties.map(p => p.price), 0)
  const maxArea = Math.max(...properties.map(p => p.area), 0)
  const maxYear = Math.max(...properties.map(p => p.yearBuilt), 0)

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      type: '',
      district: '',
      developer: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
      yearBuilt: '',
      completionDate: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

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
          <span>{t('filters')}</span>
          {hasActiveFilters && (
            <span className="bg-white text-champagne rounded-full px-2 py-1 text-xs font-bold">
              {Object.values(filters).filter(v => v !== '').length}
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
                <h2 className="text-xl font-semibold text-graphite">{t('filters')}</h2>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                {/* Filter content will be rendered here */}
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
            <h2 className="text-xl font-semibold text-graphite">{t('filters')}</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-champagne hover:text-champagne/80 font-medium"
              >
                {t('clearAll')}
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
        {/* Property Type */}
        <FilterSection title={t('propertyType')}>
          <div className="space-y-2">
            {propertyTypes.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={filters.type === type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {type === 'Penthouse' ? t('types.penthouse') :
                   type === 'Villa' ? t('types.villa') :
                   type === 'Apartment' ? t('types.apartment') :
                   type === 'Townhouse' ? t('types.townhouse') :
                   type === 'Office' ? t('types.office') :
                   type === 'Studio' ? t('types.studio') :
                   type === 'Пентхаус' ? t('types.penthouse') :
                   type === 'Вилла' ? t('types.villa') :
                   type === 'Апартаменты' ? t('types.apartment') :
                   type === 'Таунхаус' ? t('types.townhouse') :
                   type === 'Офис' ? t('types.office') :
                   type === 'Студия' ? t('types.studio') :
                   type === 'بنتهاوس' ? t('types.penthouse') :
                   type === 'فيلا' ? t('types.villa') :
                   type === 'شقة' ? t('types.apartment') :
                   type === 'تاون هاوس' ? t('types.townhouse') :
                   type === 'مكتب' ? t('types.office') :
                   type === 'استوديو' ? t('types.studio') :
                   type}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* District */}
        <FilterSection title={t('district')}>
          <select
            value={filters.district}
            onChange={(e) => handleFilterChange('district', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
          >
            <option value="">{t('allDistricts')}</option>
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </FilterSection>

        {/* Developer */}
        <FilterSection title={t('developer')}>
          <select
            value={filters.developer}
            onChange={(e) => handleFilterChange('developer', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
          >
            <option value="">{t('allDevelopers')}</option>
            {developers.map(developer => (
              <option key={developer} value={developer}>{developer}</option>
            ))}
          </select>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title={t('priceRange')}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('minPrice')}</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('maxPrice')}</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder={maxPrice.toLocaleString()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
              />
            </div>
          </div>
        </FilterSection>

        {/* Bedrooms */}
        <FilterSection title={t('bedrooms')}>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, '6+'].map(bedrooms => (
              <button
                key={bedrooms}
                onClick={() => handleFilterChange('bedrooms', bedrooms.toString())}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  filters.bedrooms === bedrooms.toString()
                    ? 'bg-champagne text-white border-champagne'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-champagne'
                }`}
              >
                {bedrooms === '6+' ? '6+' : bedrooms}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Bathrooms */}
        <FilterSection title={t('bathrooms')}>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, '5+'].map(bathrooms => (
              <button
                key={bathrooms}
                onClick={() => handleFilterChange('bathrooms', bathrooms.toString())}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  filters.bathrooms === bathrooms.toString()
                    ? 'bg-champagne text-white border-champagne'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-champagne'
                }`}
              >
                {bathrooms === '5+' ? '5+' : bathrooms}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Area Range */}
        <FilterSection title={t('areaRange')}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('minArea')} (sq ft)</label>
              <input
                type="number"
                value={filters.minArea}
                onChange={(e) => handleFilterChange('minArea', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('maxArea')} (sq ft)</label>
              <input
                type="number"
                value={filters.maxArea}
                onChange={(e) => handleFilterChange('maxArea', e.target.value)}
                placeholder={maxArea.toLocaleString()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
              />
            </div>
          </div>
        </FilterSection>

        {/* Year Built */}
        <FilterSection title={t('yearBuilt')}>
          <select
            value={filters.yearBuilt}
            onChange={(e) => handleFilterChange('yearBuilt', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
          >
            <option value="">{t('anyYear')}</option>
            {Array.from({ length: 10 }, (_, i) => maxYear - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </FilterSection>

        {/* Mobile Apply Button */}
        <div className="lg:hidden pt-6 border-t border-gray-200">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="w-full bg-champagne text-white px-4 py-3 rounded-lg font-medium"
          >
            {t('applyFilters')}
          </button>
        </div>
      </>
    )
  }
}
