/**
 * Normalizes image URLs to use API endpoint for uploads
 * This ensures images work correctly in production standalone mode
 * In standalone mode, Next.js doesn't serve files from public/uploads directly
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  // If already using API endpoint, encode it properly
  if (url.startsWith('/api/uploads/')) {
    // Split path and encode each segment to handle spaces and special characters
    const pathParts = url.replace('/api/uploads/', '').split('/')
    const encodedParts = pathParts.map(part => encodeURIComponent(part))
    return `/api/uploads/${encodedParts.join('/')}`
  }
  
  // If using direct uploads path, convert to API endpoint and encode
  // This is required for standalone mode in production
  if (url.startsWith('/uploads/')) {
    // Split path and encode each segment to handle spaces and special characters
    const pathParts = url.replace('/uploads/', '').split('/')
    const encodedParts = pathParts.map(part => encodeURIComponent(part))
    return `/api/uploads/${encodedParts.join('/')}`
  }
  
  // If it's an external URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If it's a data URL, return as is
  if (url.startsWith('data:')) {
    return url
  }
  
  // Default: return as is
  return url
}

/**
 * Normalize upload URL for API response (images and files).
 * Converts /uploads/... to /api/uploads/... for reliable serving in standalone mode.
 */
export function normalizeUploadUrl(url: string | null | undefined): string {
  return normalizeImageUrl(url)
}
