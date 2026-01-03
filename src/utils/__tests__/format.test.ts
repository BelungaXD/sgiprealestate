/**
 * Utility functions tests
 */

describe('Format Utilities', () => {
  describe('formatPrice', () => {
    it('formats AED currency correctly', () => {
      const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
        }).format(price)
      }

      expect(formatPrice(2500000, 'AED')).toContain('2,500,000')
    })

    it('formats USD currency correctly', () => {
      const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
        }).format(price)
      }

      const result = formatPrice(1000000, 'USD')
      expect(result).toContain('1,000,000')
    })
  })

  describe('formatArea', () => {
    it('formats area with sq ft', () => {
      const formatArea = (area: number, unit: string) => {
        return `${area.toLocaleString()} ${unit}`
      }

      expect(formatArea(2500, 'sq ft')).toBe('2,500 sq ft')
    })

    it('formats area with sq m', () => {
      const formatArea = (area: number, unit: string) => {
        return `${area.toLocaleString()} ${unit}`
      }

      expect(formatArea(250, 'sq m')).toBe('250 sq m')
    })
  })
})
