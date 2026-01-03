import { ReactNode } from 'react'

interface AnimateOnScrollCSSProps {
  children: ReactNode
  className?: string
  delay?: number
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-in'
}

export default function AnimateOnScrollCSS({
  children,
  className = '',
  delay = 0,
  animation = 'fade-up',
}: AnimateOnScrollCSSProps) {
  const delayClass = delay === 0 
    ? 'animate-on-scroll-delay-0'
    : delay === 100 
    ? 'animate-on-scroll-delay-100'
    : delay === 200
    ? 'animate-on-scroll-delay-200'
    : delay === 300
    ? 'animate-on-scroll-delay-300'
    : delay === 400
    ? 'animate-on-scroll-delay-400'
    : delay === 500
    ? 'animate-on-scroll-delay-500'
    : 'animate-on-scroll-delay-0'

  const animationClass = {
    'fade-up': 'animate-fade-up',
    'fade-in': 'animate-fade-in-scroll',
    'slide-left': 'animate-slide-left',
    'slide-right': 'animate-slide-right',
    'scale-in': 'animate-scale-in',
  }[animation]

  return (
    <div 
      className={`${animationClass} ${delayClass} ${className}`}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </div>
  )
}

