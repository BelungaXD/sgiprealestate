import { render, screen } from '@testing-library/react'
import Home from '@/pages/index'

// Mock all components
jest.mock('@/components/layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

jest.mock('@/components/sections/Hero', () => {
  return function MockHero() {
    return <div data-testid="hero">Hero Section</div>
  }
})

jest.mock('@/components/sections/Statistics', () => {
  return function MockStatistics() {
    return <div data-testid="statistics">Statistics Section</div>
  }
})

jest.mock('@/components/sections/Advantages', () => {
  return function MockAdvantages() {
    return <div data-testid="advantages">Advantages Section</div>
  }
})

jest.mock('@/components/sections/FeaturedProperties', () => {
  return function MockFeaturedProperties() {
    return <div data-testid="featured-properties">Featured Properties</div>
  }
})

jest.mock('@/components/sections/Partners', () => {
  return function MockPartners() {
    return <div data-testid="partners">Partners Section</div>
  }
})

jest.mock('@/components/sections/CTA', () => {
  return function MockCTA() {
    return <div data-testid="cta">CTA Section</div>
  }
})

describe('Home Page', () => {
  it('renders all main sections', () => {
    render(<Home />)
    
    expect(screen.getByTestId('layout')).toBeInTheDocument()
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('statistics')).toBeInTheDocument()
    expect(screen.getByTestId('advantages')).toBeInTheDocument()
    expect(screen.getByTestId('featured-properties')).toBeInTheDocument()
    expect(screen.getByTestId('partners')).toBeInTheDocument()
    expect(screen.getByTestId('cta')).toBeInTheDocument()
  })

  it('renders page title in head', () => {
    render(<Home />)
    
    // Check if Head component is rendered (title would be in document)
    const title = document.querySelector('title')
    expect(title).toBeInTheDocument()
  })
})
