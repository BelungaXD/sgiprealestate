import { render, screen } from '@testing-library/react'
import AreaCard from '../AreaCard'

// Mock next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
    },
  }),
}))

const mockArea = {
  id: '1',
  name: 'Downtown Dubai',
  nameEn: 'Downtown Dubai',
  description: 'The heart of modern Dubai',
  descriptionEn: 'The heart of modern Dubai',
  city: 'Dubai',
  image: 'https://example.com/image.jpg',
  propertiesCount: 45,
  averagePrice: 3200000,
  currency: 'AED',
  slug: 'downtown-dubai',
  coordinates: { lat: 25.1972, lng: 55.2744 },
  highlights: ['Burj Khalifa', 'Dubai Mall'],
  amenities: ['Shopping', 'Dining'],
}

describe('AreaCard Component', () => {
  it('renders area card with name', () => {
    render(<AreaCard area={mockArea} />)
    
    expect(screen.getByText('Downtown Dubai')).toBeInTheDocument()
  })

  it('displays area image', () => {
    render(<AreaCard area={mockArea} />)
    
    const image = screen.getByAltText('Downtown Dubai')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', mockArea.image)
  })

  it('displays properties count', () => {
    render(<AreaCard area={mockArea} />)
    
    // Use getAllByText since the number appears multiple times
    const elements = screen.getAllByText(/45/)
    expect(elements.length).toBeGreaterThan(0)
  })

  it('displays average price', () => {
    render(<AreaCard area={mockArea} />)
    
    expect(screen.getByText(/AED/)).toBeInTheDocument()
  })

  it('renders explore button', () => {
    render(<AreaCard area={mockArea} />)
    
    const exploreButton = screen.getByText(/Explore|Изучить/i)
    expect(exploreButton).toBeInTheDocument()
  })
})
