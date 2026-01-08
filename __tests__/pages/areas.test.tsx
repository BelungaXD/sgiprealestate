import { render, screen } from '@testing-library/react'
import Areas from '@/pages/areas'

// Mock components
jest.mock('@/components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

jest.mock('@/components/areas/AreaCard', () => {
  return function MockAreaCard({ area }: { area: any }) {
    return <div data-testid={`area-card-${area.id}`}>{area.nameEn}</div>
  }
})

jest.mock('@/components/areas/AreaStats', () => {
  return function MockAreaStats() {
    return <div data-testid="area-stats">Area Statistics</div>
  }
})

describe('Areas Page', () => {
  it('renders areas page with title', () => {
    render(<Areas />)
    
    // Title is rendered as translation key in mock
    expect(screen.getByText('title')).toBeInTheDocument()
  })

  it('renders area cards', () => {
    render(<Areas />)
    
    // Check if area cards are rendered
    expect(screen.getByTestId('area-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('area-card-2')).toBeInTheDocument()
  })

  it('renders area statistics section', () => {
    const { container } = render(<Areas />)
    
    // Check for stats section (it's rendered but not with testid)
    const statsSection = container.querySelector('.bg-gray-50')
    expect(statsSection).toBeInTheDocument()
  })

  it('displays areas description', () => {
    render(<Areas />)
    
    // Description is rendered as translation key
    expect(screen.getByText('description')).toBeInTheDocument()
  })
})
