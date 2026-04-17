/**
 * Build a safe iframe src for Google Maps from a user-pasted link.
 * Only allows known Google Maps hostnames to avoid open redirects.
 *
 * Important: never put a full https://maps... URL inside &q= — Maps often
 * fails to resolve it and shows a world view. Prefer lat,lng or plain address.
 */

const ALLOWED_HOSTS = new Set([
  'www.google.com',
  'google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
])

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (ALLOWED_HOSTS.has(h)) return true
  if (h.endsWith('.google.com')) return true
  if (h.endsWith('.goo.gl')) return true
  return false
}

/**
 * Lat/lng for the *place pin*, not the map camera.
 * Order matters: !3d!4d is usually the dropped pin; the first @lat,lng is often
 * only the viewport center (wrong marker with output=embed).
 */
export function extractLatLngFromGoogleMapsUrl(raw: string): {
  lat: number
  lng: number
} | null {
  try {
    const s = raw.trim().split('#')[0]

    const d3dAll = [...s.matchAll(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/g)]
    if (d3dAll.length > 0) {
      const m = d3dAll[d3dAll.length - 1]
      const lat = parseFloat(m[1])
      const lng = parseFloat(m[2])
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
    }

    let u: URL | null = null
    try {
      u = new URL(s)
    } catch {
      u = null
    }

    if (u) {
      const q = u.searchParams.get('q')
      if (q) {
        const coordMatch = q.trim().match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1])
          const lng = parseFloat(coordMatch[2])
          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
        }
      }
      const ll = u.searchParams.get('ll')
      if (ll) {
        const parts = ll.split(',')
        if (parts.length >= 2) {
          const lat = parseFloat(parts[0])
          const lng = parseFloat(parts[1])
          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
        }
      }
    }

    const atAll = [...s.matchAll(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/g)]
    if (atAll.length > 0) {
      const m = atAll[atAll.length - 1]
      const lat = parseFloat(m[1])
      const lng = parseFloat(m[2])
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
    }
  } catch {
    return null
  }
  return null
}

function legacyEmbedFromQuery(query: string, zoom: number): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed&hl=en`
}

function isShortLinkHost(host: string): boolean {
  const h = host.toLowerCase()
  return h === 'goo.gl' || h === 'maps.app.goo.gl' || h.endsWith('.goo.gl')
}

/**
 * @param fallbackAddress — property address line; used when the pasted link *   is a short URL or a long maps URL without extractable coordinates.
 */
export function googleMapsEmbedSrcFromUserUrl(
  raw: string | null | undefined,
  fallbackAddress: string
): string | null {
  if (!raw?.trim()) return null
  const trimmed = raw.trim().split('#')[0]
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (!isAllowedHost(url.hostname)) return null

  const path = url.pathname.toLowerCase()
  if (path.includes('/maps/embed')) {
    return trimmed
  }

  const pb = url.searchParams.get('pb')
  if (pb && pb.startsWith('!')) {
    return `https://www.google.com/maps/embed?pb=${encodeURIComponent(pb)}`
  }

  const coords = extractLatLngFromGoogleMapsUrl(trimmed)
  if (coords) {
    return legacyEmbedFromQuery(`${coords.lat},${coords.lng}`, 16)
  }

  if (isShortLinkHost(url.hostname)) {
    const addr = fallbackAddress?.trim()
    if (addr) return legacyEmbedFromQuery(addr, 15)
    return null
  }

  const addr = fallbackAddress?.trim()
  if (addr) return legacyEmbedFromQuery(addr, 15)

  return null
}
