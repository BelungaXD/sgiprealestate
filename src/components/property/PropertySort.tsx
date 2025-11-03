import { useTranslation } from 'next-i18next'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface PropertySortProps {
  sortBy: string
  onSortChange: (sortBy: string) => void
}

export default function PropertySort({ sortBy, onSortChange }: PropertySortProps) {
  const { t } = useTranslation('properties')

  const sortOptions = [
    { value: 'price-asc', label: t('sort.priceAsc') },
    { value: 'price-desc', label: t('sort.priceDesc') },
    { value: 'area-asc', label: t('sort.areaAsc') },
    { value: 'area-desc', label: t('sort.areaDesc') },
    { value: 'newest', label: t('sort.newest') },
    { value: 'oldest', label: t('sort.oldest') },
  ]

  return (
    <div className="relative">
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-champagne focus:outline-none focus:ring-2 focus:ring-champagne/50 focus:border-champagne"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )
}
