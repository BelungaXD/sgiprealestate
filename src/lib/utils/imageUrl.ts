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
 * Pre-generated small file under `images/thumbnails/` (same basename as main) for list/grid cards.
 */
export function propertyListingImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  const key = uploadUrlCompareKey(url)
  if (!key || !key.startsWith('properties/images/') || key.includes('/thumbnails/')) {
    return normalizeImageUrl(url)
  }
  const parts = key.split('/')
  const file = parts[parts.length - 1]
  if (!file) {
    return normalizeImageUrl(url)
  }
  const dir = parts.slice(0, -1)
  const thumbKey = [...dir, 'thumbnails', file].join('/')
  return normalizeImageUrl(`/uploads/${thumbKey}`)
}

/**
 * Gallery bottom strip: try modern `thumbnails/name`, then legacy `thumbnails/thumb-name`, then full file.
 * Prevents 404 + accidental multi-MB loads for 110px previews.
 */
export function propertyGalleryThumbSrcCandidates(resolvedImageUrl: string): string[] {
  if (!resolvedImageUrl) return []
  const key = uploadUrlCompareKey(resolvedImageUrl)
  if (!key.startsWith('properties/images/') || key.includes('/thumbnails/')) {
    const one = normalizeImageUrl(resolvedImageUrl)
    return one ? [one] : []
  }
  const parts = key.split('/')
  const file = parts[parts.length - 1] || ''
  const ordered: string[] = [propertyListingImageUrl(resolvedImageUrl)]
  if (file && !file.startsWith('thumb-')) {
    const legacyKey = [...parts.slice(0, 2), 'thumbnails', `thumb-${file}`].join('/')
    ordered.push(normalizeImageUrl(`/uploads/${legacyKey}`))
  }
  ordered.push(normalizeImageUrl(resolvedImageUrl))
  return [...new Set(ordered.filter(Boolean))]
}

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
