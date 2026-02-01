/**
 * Normalizes image URLs to use API endpoint for uploads
 * This ensures images work correctly in production standalone mode
 * In standalone mode, Next.js doesn't serve files from public/uploads directly
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  
  // If already using API endpoint, return as is
  if (url.startsWith('/api/uploads/')) {
    return url
  }
  
  // If using direct uploads path, convert to API endpoint
  // This is required for standalone mode in production
  if (url.startsWith('/uploads/')) {
    return `/api${url}`
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
