import { useTranslation } from 'next-i18next/pages'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

interface Property {
  id: string
  type: string
  district: string
  listingMarket?: string
  areaId?: string
  developerSlug?: string
  developer: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  yearBuilt: number
}

type AreaOption = { id: string; name: string; nameEn: string | null; slug: string }
type DeveloperOption = { slug: string; label: string }

export interface PropertyFiltersState {
  listingMarket: '' | 'PRIMARY' | 'SECONDARY'
  type: string
  areaIds: string[]
  developer: string[]
  minPrice: string
  maxPrice: string
  bedrooms: string
  bathrooms: string
  minArea: string
  maxArea: string
  minYearBuilt: string
  maxYearBuilt: string
  completionDate: string
}

interface PropertyFilterProps {
  filters: PropertyFiltersState
  onFiltersChange: (filters: PropertyFiltersState) => void
  properties: Property[]
}

export default function PropertyFilter({
  filters,
  onFiltersChange,
  properties,
}: PropertyFilterProps) {
  const { t } = useTranslation('properties')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [developersList, setDevelopersList] = useState<DeveloperOption[]>([])
  const [areasFromApi, setAreasFromApi] = useState<AreaOption[]>([])

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [dRes, aRes] = await Promise.all([
          fetch('/api/developers'),
          fetch('/api/areas'),
        ])
        const dJson = await dRes.json()
        const aJson = await aRes.json()
        const developersFromAPI = (dJson.developers || [])
          .map((x: { slug?: string; nameEn?: string; name?: string }) => ({
            slug: x.slug || '',
            label: x.nameEn || x.name || '',
          }))
          .filter(
            (developer: DeveloperOption) =>
              developer.slug && developer.label.trim() !== ''
          )
        setDevelopersList(developersFromAPI)
        setAreasFromApi(aJson.areas || [])
      } catch (error) {
        console.error('Error fetching filter metadata:', error)
        setDevelopersList(
          Array.from(
            new Set(
              properties
                .filter((p) => p.listingMarket !== 'SECONDARY')
                .map((p) =>
                  JSON.stringify({
                    slug: p.developerSlug || p.developer,
                    label: p.developer,
                  })
                )
            )
          )
            .map((item) => JSON.parse(item) as DeveloperOption)
            .filter((developer) => developer.slug && developer.label.trim() !== '')
            .sort((a, b) => a.label.localeCompare(b.label))
        )
        setAreasFromApi([])
      }
    }
    fetchMeta()
  }, [properties])

  const propertyTypes = Array.from(new Set(properties.map((p) => p.type))).sort()
  const districts = Array.from(new Set(properties.map((p) => p.district))).sort()

  const areaChoices: { id: string; label: string }[] =
    areasFromApi.length > 0
      ? areasFromApi.map((a) => ({
          id: a.id,
          label: a.nameEn || a.name,
        }))
      : districts.map((d) => ({ id: d, label: d }))

  const allDevelopersFromAPI =
    developersList.length > 0
      ? developersList
      : Array.from(
          new Set(
            properties
              .filter((p) => p.listingMarket !== 'SECONDARY')
              .map((p) =>
                JSON.stringify({
                  slug: p.developerSlug || p.developer,
                  label: p.developer,
                })
              )
          )
        )
          .map((item) => JSON.parse(item) as DeveloperOption)
          .filter((developer) => developer.slug && developer.label.trim() !== '')
          .sort((a, b) => a.label.localeCompare(b.label))

  const developers = allDevelopersFromAPI

  const maxPrice = Math.max(...properties.map((p) => p.price), 0)
  const maxArea = Math.max(...properties.map((p) => p.area), 0)
  const currentYear = new Date().getFullYear()
  const yearsWithData = properties
    .map((p) => p.yearBuilt)
    .filter((y) => y && y > 1800 && y <= currentYear)
  const maxYear =
    yearsWithData.length > 0 ? Math.max(...yearsWithData) : currentYear
  const minYear =
    yearsWithData.length > 0
      ? Math.min(...yearsWithData)
      : Math.max(1800, currentYear - 30)

  const showDeveloperFilter =
    filters.listingMarket !== 'SECONDARY'

  useEffect(() => {
    if (filters.listingMarket === 'SECONDARY' && filters.developer.length > 0) {
      onFiltersChange({ ...filters, developer: [] })
    }
  }, [filters, onFiltersChange])

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const handleAreaToggle = (areaId: string) => {
    const current = filters.areaIds || []
    const newAreas = current.includes(areaId)
      ? current.filter((a) => a !== areaId)
      : [...current, areaId]
    onFiltersChange({ ...filters, areaIds: newAreas })
  }

  const handleDeveloperToggle = (developerValue: string) => {
    const current = filters.developer || []
    const newDevelopers = current.includes(developerValue)
      ? current.filter((d) => d !== developerValue)
      : [...current, developerValue]
    onFiltersChange({ ...filters, developer: newDevelopers })
  }

  const clearFilters = () => {
    onFiltersChange({
      listingMarket: '',
      type: '',
      areaIds: [],
      developer: [],
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      minArea: '',
      maxArea: '',
      minYearBuilt: '',
      maxYearBuilt: '',
      completionDate: '',
    })
  }

  const hasActiveFilters =
    filters.listingMarket !== '' ||
    filters.type !== '' ||
    (filters.areaIds && filters.areaIds.length > 0) ||
    (filters.developer && filters.developer.length > 0) ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.bedrooms !== '' ||
    filters.bathrooms !== '' ||
    filters.minArea !== '' ||
    filters.maxArea !== '' ||
    filters.minYearBuilt !== '' ||
    filters.maxYearBuilt !== '' ||
    filters.completionDate !== ''

  const FilterSection = ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-graphite mb-4">{title}</h3>
      {children}
    </div>
  )

  const activeFilterCount =
    (filters.listingMarket !== '' ? 1 : 0) +
    (filters.type !== '' ? 1 : 0) +
    (filters.areaIds?.length || 0) +
    (filters.developer?.length || 0) +
    (filters.minPrice !== '' || filters.maxPrice !== '' ? 1 : 0) +
    (filters.bedrooms !== '' || filters.bathrooms !== '' ? 1 : 0) +
    (filters.minArea !== '' || filters.maxArea !== '' ? 1 : 0) +
    (filters.minYearBuilt !== '' || filters.maxYearBuilt !== '' ? 1 : 0) +
    (filters.completionDate !== '' ? 1 : 0)

  return (
    <>
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-full btn-filled flex items-center justify-center space-x-2"
        >
          <FunnelIcon className="h-5 w-5" />
          <span>{t('filters')}</span>
          {hasActiveFilters && (
            <span className="bg-white text-champagne rounded-full px-2 py-1 text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-graphite">{t('filters')}</h2>
                <button onClick={() => setIsMobileOpen(false)} className="btn-close">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">{renderFilterContent()}</div>
            </div>
          </div>
        </div>
      )}

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
        <FilterSection title={t('listingMarket', 'Listing type')}>
          <div className="space-y-2">
            {([
              { value: '', label: t('allListings', 'All') },
              { value: 'PRIMARY', label: t('primary', 'Primary / Off-plan') },
              { value: 'SECONDARY', label: t('secondary', 'Secondary / Resale') },
            ] as Array<{
              value: PropertyFiltersState['listingMarket']
              label: string
            }>).map((opt) => (
              <label key={opt.value || 'all'} className="flex items-center">
                <input
                  type="radio"
                  name="listingMarket"
                  value={opt.value}
                  checked={filters.listingMarket === opt.value}
                  onChange={() => onFiltersChange({ ...filters, listingMarket: opt.value })}
                  className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t('propertyType')}>
          <div className="space-y-2">
            {propertyTypes.map((type) => (
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
                  {type === 'PENTHOUSE'
                    ? t('types.penthouse')
                    : type === 'VILLA'
                      ? t('types.villa')
                      : type === 'APARTMENT'
                        ? t('types.apartment')
                        : type === 'TOWNHOUSE'
                          ? t('types.townhouse')
                          : type === 'OFFICE'
                            ? t('types.office')
                            : type === 'STUDIO'
                              ? t('types.studio')
                              : type === 'Пентхаус'
                                ? t('types.penthouse')
                                : type === 'Вилла'
                                  ? t('types.villa')
                                  : type === 'Апартаменты'
                                    ? t('types.apartment')
                                    : type === 'Таунхаус'
                                      ? t('types.townhouse')
                                      : type === 'Офис'
                                        ? t('types.office')
                                        : type === 'Студия'
                                          ? t('types.studio')
                                          : type === 'بنتهاوس'
                                            ? t('types.penthouse')
                                            : type === 'فيلا'
                                              ? t('types.villa')
                                              : type === 'شقة'
                                                ? t('types.apartment')
                                                : type === 'تاون هاوس'
                                                  ? t('types.townhouse')
                                                  : type === 'مكتب'
                                                    ? t('types.office')
                                                    : type === 'استوديو'
                                                      ? t('types.studio')
                                                      : type}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t('area') || 'Area'}>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {areaChoices.map((area) => {
              const isChecked = filters.areaIds && filters.areaIds.includes(area.id)
              return (
                <label key={area.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!isChecked}
                    onChange={() => handleAreaToggle(area.id)}
                    className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{area.label}</span>
                </label>
              )
            })}
          </div>
        </FilterSection>

        {showDeveloperFilter && (
          <FilterSection title={t('developer')}>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {developers.map((developer) => {
                const isChecked =
                  filters.developer && filters.developer.includes(developer.slug)
                return (
                  <label key={developer.slug} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!isChecked}
                      onChange={() => handleDeveloperToggle(developer.slug)}
                      className="h-4 w-4 text-champagne focus:ring-champagne border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{developer.label}</span>
                  </label>
                )
              })}
            </div>
          </FilterSection>
        )}

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

        <FilterSection title={t('bedrooms')}>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, '4+'].map((bedrooms) => (
              <button
                key={bedrooms}
                onClick={() => handleFilterChange('bedrooms', bedrooms.toString())}
                className={`btn-sm ${
                  filters.bedrooms === bedrooms.toString() ? 'btn-filled' : 'btn-ghost'
                }`}
              >
                {bedrooms === '4+' ? '4+' : bedrooms}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t('bathrooms')}>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, '4+'].map((bathrooms) => (
              <button
                key={bathrooms}
                onClick={() => handleFilterChange('bathrooms', bathrooms.toString())}
                className={`btn-sm ${
                  filters.bathrooms === bathrooms.toString() ? 'btn-filled' : 'btn-ghost'
                }`}
              >
                {bathrooms === '4+' ? '4+' : bathrooms}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title={t('areaRange')}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('minArea')} (m²)</label>
              <input
                type="number"
                value={filters.minArea}
                onChange={(e) => handleFilterChange('minArea', e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
                }}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('maxArea')} (m²)</label>
              <input
                type="number"
                value={filters.maxArea}
                onChange={(e) => handleFilterChange('maxArea', e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
                }}
                placeholder={maxArea.toLocaleString()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
              />
            </div>
          </div>
        </FilterSection>

        <FilterSection title={t('yearBuilt')}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('minYear') || 'Min Year'}
              </label>
              <select
                value={filters.minYearBuilt}
                onChange={(e) => handleFilterChange('minYearBuilt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
              >
                <option value="">{t('anyYear')}</option>
                {Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
                  const year = maxYear - i
                  return year >= minYear && year <= currentYear ? year : null
                })
                  .filter((year) => year !== null)
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                {t('maxYear') || 'Max Year'}
              </label>
              <select
                value={filters.maxYearBuilt}
                onChange={(e) => handleFilterChange('maxYearBuilt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-champagne/50 focus:border-champagne outline-none"
              >
                <option value="">{t('anyYear')}</option>
                {Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
                  const year = maxYear - i
                  return year >= minYear && year <= currentYear ? year : null
                })
                  .filter((year) => year !== null)
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </FilterSection>

        <div className="lg:hidden pt-6 border-t border-gray-200">
          <button onClick={() => setIsMobileOpen(false)} className="w-full btn-filled">
            {t('applyFilters')}
          </button>
        </div>
      </>
    )
  }
}
