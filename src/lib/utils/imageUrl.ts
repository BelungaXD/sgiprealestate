const baseUrl = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SITE_URL || '') : ''
const serverUrl = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SERVER_URL || '') : ''
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
    
    // In development, use server URL if available
    if (isDevelopment && serverUrl) {
      return serverUrl.replace(/\/$/, '') + path
    }
    
    return baseUrl ? baseUrl.replace(/\/$/, '') + path : path
  }

  // If using direct uploads path, convert to API endpoint and encode
  if (url.startsWith('/uploads/')) {
    const pathParts = url.replace('/uploads/', '').split('/')
    const encodedParts = pathParts.map(part => encodeURIComponent(part))
    const path = `/api/uploads/${encodedParts.join('/')}`
    
    // In development, use server URL if available, otherwise use local API endpoint
    if (isDevelopment && serverUrl) {
      return serverUrl.replace(/\/$/, '') + path
    }
    
    // In development without server URL, use local API endpoint (works with Next.js)
    if (isDevelopment) {
      return path
    }
    
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
  if (isDevelopment && serverUrl && url.startsWith('/')) {
    return serverUrl.replace(/\/$/, '') + url
  }
  
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
