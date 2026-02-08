import { useState, useCallback, useEffect, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PropertyGalleryProps {
  images?: string[] | null
}

// Try alternate path when one form returns HTML or 404 (e.g. /api/uploads/ <-> /uploads/)
function alternateUploadUrl(url: string): string {
  if (url.startsWith('/api/uploads/')) return url.replace(/^\/api\/uploads/, '/uploads')
  if (url.startsWith('/uploads/')) return url.replace(/^\/uploads/, '/api/uploads')
  return url
}

export default function PropertyGallery({ images: imagesProp }: PropertyGalleryProps) {
  const images = imagesProp ?? []
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [thumbnailScrollPosition, setThumbnailScrollPosition] = useState(0)
  const thumbnailScrollRef = useRef<HTMLDivElement>(null)
  // Per-URL: try alternate path once on error; then mark failed and show placeholder
  const [urlFallback, setUrlFallback] = useState<Record<string, string>>({})
  const [urlFailed, setUrlFailed] = useState<Set<string>>(new Set())

  const resolveUrl = useCallback((url: string) => {
    if (urlFailed.has(url)) return null
    return urlFallback[url] || url
  }, [urlFallback, urlFailed])

  const handleImageError = useCallback((url: string) => {
    const tried = urlFallback[url]
    const alt = alternateUploadUrl(url)
    if (tried) {
      setUrlFailed((prev) => new Set(prev).add(url))
    } else if (alt !== url) {
      setUrlFallback((prev) => ({ ...prev, [url]: alt }))
    } else {
      setUrlFailed((prev) => new Set(prev).add(url))
    }
  }, [urlFallback])

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
  }, [])

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (!thumbnailScrollRef.current) return
    const scrollAmount = 300 // pixels to scroll
    const newPosition = direction === 'left' 
      ? thumbnailScrollRef.current.scrollLeft - scrollAmount
      : thumbnailScrollRef.current.scrollLeft + scrollAmount
    thumbnailScrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' })
  }

  // Close lightbox on Escape
  useEffect(() => {
    if (!isLightboxOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isLightboxOpen, closeLightbox])

  const isVideo = (url: string) => {
    return url.includes('/videos/') || 
           url.endsWith('.mp4') || 
           url.endsWith('.mov') || 
           url.endsWith('.avi') || 
           url.endsWith('.webm') ||
           url.endsWith('.MP4') ||
           url.endsWith('.MOV') ||
           url.endsWith('.AVI') ||
           url.endsWith('.WEBM')
  }

  // Get thumbnail URL - import stores thumbnails as thumb-{filename} in thumbnails/
  const getThumbnailUrl = (url: string): string => {
    if (isVideo(url)) return url
    const urlParts = url.split('/')
    const filename = urlParts[urlParts.length - 1]
    const thumbFilename = filename.startsWith('thumb-') ? filename : `thumb-${filename}`
    return url.replace(/\/images\/[^/]+$/, `/images/thumbnails/${thumbFilename}`)
  }

  const currentMedia = images[currentIndex] || ''
  const isCurrentVideo = isVideo(currentMedia)
  const mainDisplayUrl = resolveUrl(currentMedia)
  // Main hero: use full resolution for best quality; thumbnails only used in thumbnail strip below

  // After page load, preload full-size images in background so lightbox opens fast
  useEffect(() => {
    const imageUrls = images.filter((url) => !isVideo(url))
    if (imageUrls.length === 0) return
    const timer = window.setTimeout(() => {
      imageUrls.forEach((url) => {
        const img = new Image()
        img.src = url
      })
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [images])

  return (
    <>
      <div className="relative">
        {/* Main Image/Video - large preview container with fixed aspect ratio */}
        <div className="relative w-full max-w-5xl mx-auto aspect-[16/9] overflow-hidden bg-gray-900 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {isCurrentVideo ? (
              <video
                key={currentIndex}
                src={currentMedia}
                className="w-full h-full object-cover cursor-pointer transition-opacity duration-300"
                onClick={() => openLightbox(currentIndex)}
                controls={false}
                muted
                loop
              />
            ) : mainDisplayUrl ? (
              <img
                key={currentIndex}
                src={mainDisplayUrl}
                alt={`Property image ${currentIndex + 1}`}
                className="w-full h-full object-cover cursor-pointer transition-opacity duration-300"
                onClick={() => openLightbox(currentIndex)}
                onError={() => handleImageError(currentMedia)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 gap-2 p-8">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Image unavailable</span>
              </div>
            )}
          </div>
          
          {/* Navigation Arrows - improved design */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 p-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-110 z-20"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 p-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-110 z-20"
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          )}
          
          {/* Media Counter - improved design */}
          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-2xl z-20">
            {currentIndex + 1} / {images.length}
            {isCurrentVideo && (
              <span className="ml-2 text-xs">🎥</span>
            )}
          </div>
        </div>

        {/* Thumbnail Strip - horizontal scroll */}
        {images.length > 1 && (
          <div className="px-4 py-4 bg-white border-t border-gray-200 shadow-sm relative">
            {/* Left Arrow */}
            <button
              onClick={() => scrollThumbnails('left')}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-2 shadow-md transition-all duration-200 hover:shadow-lg"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
            </button>
            
            {/* Right Arrow */}
            <button
              onClick={() => scrollThumbnails('right')}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-2 shadow-md transition-all duration-200 hover:shadow-lg"
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-700" />
            </button>

            <div 
              ref={thumbnailScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-champagne scrollbar-track-gray-100 pb-2 px-12" 
              style={{ scrollbarWidth: 'thin' }}
            >
              {images.map((image, index) => {
                const isThumbVideo = isVideo(image)
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 relative bg-gray-100 flex items-center justify-center ${
                      index === currentIndex
                        ? 'border-champagne ring-2 ring-champagne/50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                    }`}
                    style={{ width: '110px', height: '110px', minWidth: '110px' }}
                  >
                    {isThumbVideo ? (
                      <video
                        src={image}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                    ) : (() => {
                      const thumbUrl = resolveUrl(image)
                      const thumbSrc = thumbUrl ? getThumbnailUrl(thumbUrl) : null
                      const fullUrl = thumbUrl || image
                      return thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (target.src !== fullUrl && thumbSrc !== fullUrl) {
                              target.src = fullUrl
                            } else {
                              handleImageError(image)
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        </div>
                      )
                    })()}
                    {isThumbVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal - improved design with smooth transitions */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          <div
            className="relative w-full h-full flex items-center justify-center px-4 md:px-16 lg:px-24"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - improved design */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-xl transition-all duration-200 hover:scale-110"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Image/Video Container - with smooth transitions */}
            <div
              className="relative max-w-7xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {isCurrentVideo ? (
                <video
                  key={currentIndex}
                  src={currentMedia}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300"
                  controls
                  autoPlay
                  onClick={(e) => e.stopPropagation()}
                />
              ) : mainDisplayUrl ? (
                <img
                  key={currentIndex}
                  src={mainDisplayUrl}
                  alt={`Property image ${currentIndex + 1}`}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300"
                  onClick={(e) => e.stopPropagation()}
                  onError={() => handleImageError(currentMedia)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 gap-2 p-8">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                  </svg>
                  <span className="text-sm">Image unavailable</span>
                </div>
              )}
            </div>
            
            {/* Navigation Arrows - improved design */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="h-8 w-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-xl transition-all duration-200 hover:scale-110"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="h-8 w-8" />
                </button>
                
                {/* Image Counter in Lightbox - improved design */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg">
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
