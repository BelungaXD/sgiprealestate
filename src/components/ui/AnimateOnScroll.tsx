import { useEffect, useRef, useState, ReactNode } from 'react'

interface AnimateOnScrollProps {
  children: ReactNode
  className?: string
  delay?: number
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-in'
}

export default function AnimateOnScroll({
  children,
  className = '',
  delay = 0,
  animation = 'fade-up',
}: AnimateOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [delay])

  const animationClasses = {
    'fade-up': isVisible
      ? 'opacity-100 translate-y-0'
      : 'opacity-0 translate-y-8',
    'fade-in': isVisible ? 'opacity-100' : 'opacity-0',
    'slide-left': isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 translate-x-8',
    'slide-right': isVisible
      ? 'opacity-100 translate-x-0'
      : 'opacity-0 -translate-x-8',
    'scale-in': isVisible
      ? 'opacity-100 scale-100'
      : 'opacity-0 scale-95',
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${animationClasses[animation]} ${className}`}
      style={{
        willChange: isVisible ? 'auto' : 'transform, opacity',
      }}
    >
      {children}
    </div>
  )
}
