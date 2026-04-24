import { useState, useEffect } from 'react'
import { propertyListingImageUrl, normalizeUploadUrl } from '@/lib/utils/imageUrl'

type PropertyListingImageProps = {
  imageUrl: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

/**
 * Pre-generated thumbnail (max 40 kB) when available; onError serves full image (legacy `thumb-` only).
 */
export default function PropertyListingImage({
  imageUrl,
  alt,
  className,
  loading = 'lazy',
}: PropertyListingImageProps) {
  const full = normalizeUploadUrl(imageUrl) || imageUrl
  const thumb = propertyListingImageUrl(imageUrl)
  const [src, setSrc] = useState(thumb)

  useEffect(() => {
    setSrc(propertyListingImageUrl(imageUrl))
  }, [imageUrl])

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        if (src !== full) {
          setSrc(full)
        }
      }}
    />
  )
}
