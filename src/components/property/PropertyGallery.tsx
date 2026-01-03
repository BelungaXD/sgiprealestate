import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PropertyGalleryProps {
  images: string[]
}

export default function PropertyGallery({ images }: PropertyGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

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

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

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

  // Get thumbnail URL if available, otherwise use full image
  const getThumbnailUrl = (url: string): string => {
    if (isVideo(url)) return url
    // Check if thumbnail exists (in thumbnails subdirectory)
    const urlParts = url.split('/')
    const filename = urlParts[urlParts.length - 1]
    const thumbnailUrl = url.replace('/images/', '/images/thumbnails/')
    return thumbnailUrl
  }

  const currentMedia = images[currentIndex] || ''
  const isCurrentVideo = isVideo(currentMedia)

  return (
    <>
      <div className="relative">
        {/* Main Image/Video */}
        <div className="relative h-96 md:h-[500px] overflow-hidden bg-gray-100 flex items-center justify-center">
          {isCurrentVideo ? (
            <video
              src={currentMedia}
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={() => openLightbox(currentIndex)}
              controls={false}
              muted
              loop
            />
          ) : (
            <img
              src={currentMedia}
            alt={`Property image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain cursor-pointer"
            onClick={() => openLightbox(currentIndex)}
          />
          )}
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-colors"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          )}
          
          {/* Media Counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
            {isCurrentVideo && (
              <span className="ml-2 text-xs">🎥</span>
            )}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex space-x-2 p-4 overflow-x-auto">
            {images.map((image, index) => {
              const isThumbVideo = isVideo(image)
              return (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors relative bg-gray-100 flex items-center justify-center ${
                  index === currentIndex
                    ? 'border-champagne'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                  style={{ width: '80px', height: '80px' }}
                >
                  {isThumbVideo ? (
                    <video
                      src={image}
                      className="max-w-full max-h-full object-contain"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={getThumbnailUrl(image)}
                  alt={`Thumbnail ${index + 1}`}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to full image if thumbnail doesn't exist
                        const target = e.target as HTMLImageElement
                        if (target.src !== image) {
                          target.src = image
                        }
                      }}
                    />
                  )}
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
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div className="relative w-full h-full flex items-center justify-center px-16 md:px-24">
            {/* Close Button - Outside image area */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Image/Video Container */}
            <div className="relative max-w-7xl max-h-full flex items-center justify-center">
              {isCurrentVideo ? (
                <video
                  src={currentMedia}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
            <img
                  src={currentMedia}
              alt={`Property image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
            />
              )}
            </div>
            
            {/* Navigation Arrows - Outside image area */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-lg transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="h-8 w-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-lg transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="h-8 w-8" />
                </button>
                
                {/* Image Counter in Lightbox */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
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
