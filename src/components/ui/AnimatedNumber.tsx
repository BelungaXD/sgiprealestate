import { useState, useEffect, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
  className?: string
  onComplete?: () => void
}

export default function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  decimals = 0,
  className = '',
  onComplete
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const previousValueRef = useRef<number>(0)
  const hasAnimatedRef = useRef<boolean>(false)

  useEffect(() => {
    // Cancel any ongoing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (value === 0) {
      setDisplayValue(0)
      previousValueRef.current = 0
      hasAnimatedRef.current = false
      return
    }

    // Always start from 0 for first animation
    const startValue = 0
    const endValue = value
    const startTime = performance.now()
    startTimeRef.current = startTime

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) return

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)

      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      
      // Update display value immediately
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Ensure final value is set exactly
        setDisplayValue(endValue)
        previousValueRef.current = endValue
        hasAnimatedRef.current = true
        startTimeRef.current = null
        animationRef.current = null
        if (onComplete) {
          onComplete()
        }
      }
    }

    // Start animation immediately
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      startTimeRef.current = null
    }
  }, [value, duration, onComplete])

  const formatValue = (num: number): string => {
    if (decimals === 0) {
      return Math.floor(num).toString()
    }
    return num.toFixed(decimals)
  }

  return (
    <span className={className}>
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  )
}
