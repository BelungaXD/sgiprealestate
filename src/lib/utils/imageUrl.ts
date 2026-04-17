const baseUrl = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SITE_URL || '') : ''
const isDevelopment = typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : false

/**
 * Normalizes image URLs to use API endpoint for uploads
 * This ensures images work correctly in production standalone mode
 * In standalone mode, Next.js doesn't serve files from public/uploads directly.
 * If NEXT_PUBLIC_SITE_URL is set, returns absolute URL so images load when relative paths fail (e.g. proxy).
 * In development mode, if NEXT_PUBLIC_SERVER_URL is set, uses server URL for images.
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return ''

  // If already using API endpoint, encode it properly
  if (url.startsWith('/api/uploads/')) {
    const pathParts = url.replace('/api/uploads/', '').split('/')
    const encodedParts = pathParts.map(part => encodeURIComponent(part))
    const path = `/api/uploads/${encodedParts.join('/')}`
    
    // In development, always use relative path (works with Next.js dev server)
    if (isDevelopment) {
      return path
    }
    
    // In production, use baseUrl if set, otherwise relative path
    return baseUrl ? baseUrl.replace(/\/$/, '') + path : path
  }

  // If using direct uploads path, convert to API endpoint and encode
  if (url.startsWith('/uploads/')) {
    const pathParts = url.replace('/uploads/', '').split('/')
    const encodedParts = pathParts.map(part => encodeURIComponent(part))
    const path = `/api/uploads/${encodedParts.join('/')}`
    
    // In development, always use relative path (works with Next.js dev server)
    if (isDevelopment) {
      return path
    }
    
    // In production, use baseUrl if set, otherwise relative path
    return baseUrl ? baseUrl.replace(/\/$/, '') + path : path
  }

  // If it's an external URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // If it's a data URL, return as is
  if (url.startsWith('data:')) {
    return url
  }

  // Default: return as is (with optional base for relative paths)
  // In development, always use relative paths
  if (isDevelopment && url.startsWith('/')) {
    return url
  }
  
  // In production, use baseUrl if set
  if (baseUrl && url.startsWith('/')) {
    return baseUrl.replace(/\/$/, '') + url
  }
  return url
}

/**
 * Normalize upload URL for API response (images and files).
 * Converts /uploads/... to /api/uploads/... for reliable serving in standalone mode.
 */
export function normalizeUploadUrl(url: string | null | undefined): string {
  return normalizeImageUrl(url)
}

/**
 * Stable key for comparing upload URLs that may differ by /uploads vs /api/uploads,
 * percent-encoding, or absolute origin (same logical file).
 */
export function uploadUrlCompareKey(url: string | null | undefined): string {
  if (url == null || url === '') return ''
  const s = String(url).trim()
  if (s.startsWith('data:')) return s

  let pathname = s
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      pathname = new URL(s).pathname
    } catch {
      return s
    }
  }

  const apiMarker = '/api/uploads/'
  const directMarker = '/uploads/'
  let rest = ''
  const apiIdx = pathname.indexOf(apiMarker)
  if (apiIdx >= 0) {
    rest = pathname.slice(apiIdx + apiMarker.length)
  } else {
    const upIdx = pathname.indexOf(directMarker)
    if (upIdx >= 0) {
      rest = pathname.slice(upIdx + directMarker.length)
    } else {
      return s
    }
  }

  return rest
    .split('/')
    .map((seg) => {
      if (!seg) return seg
      try {
        return decodeURIComponent(seg)
      } catch {
        return seg
      }
    })
    .join('/')
}
