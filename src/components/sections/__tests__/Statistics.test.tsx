import { render, screen } from '@testing-library/react'
import Statistics from '../Statistics'

// Mock AnimateOnScroll component
jest.mock('@/components/ui/AnimateOnScroll', () => {
  return function MockAnimateOnScroll({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }
})

describe('Statistics Component', () => {
  it('renders statistics section', () => {
    const { container } = render(<Statistics />)
    
    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
  })

  it('displays statistics title', () => {
    render(<Statistics />)
    
    const title = screen.getByText('stats.title')
    expect(title).toBeInTheDocument()
  })

  it('displays all statistics items', () => {
    render(<Statistics />)
    
    // Check for statistics numbers
    expect(screen.getByText('10+')).toBeInTheDocument()
    expect(screen.getByText('500+')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('98%')).toBeInTheDocument()
  })

  it('displays statistics labels', () => {
    render(<Statistics />)
    
    expect(screen.getByText('stats.yearsExperience')).toBeInTheDocument()
    expect(screen.getByText('stats.propertiesSold')).toBeInTheDocument()
    expect(screen.getByText('stats.developers')).toBeInTheDocument()
    expect(screen.getByText('stats.clientSatisfaction')).toBeInTheDocument()
  })

  it('has correct CSS classes', () => {
    const { container } = render(<Statistics />)
    
    const section = container.querySelector('section')
    expect(section).toHaveClass('section-padding', 'bg-white')
  })
})
