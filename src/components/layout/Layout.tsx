import { ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Lazy load layout components to reduce initial bundle size
const Header = dynamic(() => import('./Header'), {
  ssr: true, // Keep SSR for SEO
})

const Footer = dynamic(() => import('./Footer'), {
  ssr: true, // Keep SSR for SEO
})

const WhatsAppWidget = dynamic(() => import('../ui/WhatsAppWidget'), {
  ssr: false, // No need for SSR on widget
})

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
