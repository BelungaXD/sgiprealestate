import { render, screen } from '@testing-library/react'
import Header from '../Header'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    locale: 'en',
    push: jest.fn(),
  }),
}))

// Mock LanguageSwitcher
jest.mock('@/components/ui/LanguageSwitcher', () => {
  return function MockLanguageSwitcher() {
    return <div>Language Switcher</div>
  }
})

// Mock next-i18next with proper translations
jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'nav.home': 'Home',
        'nav.properties': 'Properties',
        'nav.areas': 'Areas',
        'nav.developers': 'Developers',
        'nav.services': 'Services',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'nav.getQuote': 'Get Quote',
      }
      return translations[key] || key
    },
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
}))

describe('Header Component', () => {
  it('renders header with logo', () => {
    render(<Header />)
    
    const logo = screen.getByText(/SGIP/i)
    expect(logo).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Header />)
    
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Properties')).toBeInTheDocument()
    expect(screen.getByText('Areas')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders Get Quote button', () => {
    render(<Header />)
    
    const quoteButton = screen.getByText('Get Quote')
    expect(quoteButton).toBeInTheDocument()
  })

  it('has correct header structure', () => {
    const { container } = render(<Header />)
    
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'sticky', 'top-0', 'z-40')
  })
})
