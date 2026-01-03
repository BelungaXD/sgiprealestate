import { render, screen } from '@testing-library/react'
import Footer from '../Footer'

// Mock next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'footer.description': 'Your trusted partner in luxury real estate',
        'footer.company': 'Company',
        'footer.about': 'About Us',
        'footer.contact': 'Contact Us',
        'footer.allRightsReserved': 'All rights reserved.',
      }
      return translations[key] || key
    },
  }),
}))

describe('Footer Component', () => {
  it('renders footer with company info', () => {
    render(<Footer />)
    
    const logo = screen.getByText('SGIP')
    expect(logo).toBeInTheDocument()
  })

  it('renders footer links', () => {
    render(<Footer />)
    
    expect(screen.getByText('About Us')).toBeInTheDocument()
    expect(screen.getByText('Contact Us')).toBeInTheDocument()
  })

  it('displays copyright information', () => {
    render(<Footer />)
    
    expect(screen.getByText(/All rights reserved/i)).toBeInTheDocument()
  })

  it('has correct footer structure', () => {
    const { container } = render(<Footer />)
    
    const footer = container.querySelector('footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('bg-graphite', 'text-white')
  })
})
