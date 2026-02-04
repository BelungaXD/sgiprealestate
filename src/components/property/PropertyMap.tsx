'use client'

/**
 * PropertyMap - Google Maps embed for property location.
 * Uses Maps Embed API when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set.
 * Fallback: link to Google Maps with the address.
 */

interface PropertyMapProps {
  location: string
  coordinates?: { lat: number; lng: number } | null
}

const isValidCoords = (coords: { lat: number; lng: number }) =>
  coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' &&
  coords.lat !== 0 && coords.lng !== 0 &&
  coords.lat >= -90 && coords.lat <= 90 && coords.lng >= -180 && coords.lng <= 180

export default function PropertyMap({ location, coordinates }: PropertyMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasValidCoords = coordinates && isValidCoords(coordinates)

  // Build embed URL: place mode with address or coordinates
  const embedQuery = hasValidCoords
    ? `${coordinates!.lat},${coordinates!.lng}`
    : encodeURIComponent(location)
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${embedQuery}&zoom=15`
    : null

  // Fallback: direct link to Google Maps
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`

  if (embedUrl) {
    return (
      <div className="h-64 sm:h-80 rounded-lg overflow-hidden">
        <iframe
          title={location}
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    )
  }

  return (
    <a
      href={mapsLink}
      target="_blank"
      rel="noopener noreferrer"
      className="h-64 sm:h-80 rounded-lg overflow-hidden bg-gray-200 flex flex-col items-center justify-center gap-3 hover:bg-gray-300 transition-colors"
    >
      <span className="text-gray-600 text-center px-4">{location}</span>
      <span className="text-champagne font-medium">View on Google Maps →</span>
    </a>
  )
}
