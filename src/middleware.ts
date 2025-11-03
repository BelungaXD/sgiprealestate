import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = url.host
  const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || ''
  const isDev = process.env.NODE_ENV !== 'production'

  if (!isDev && host.includes('sgiprealestate.com') && country.toUpperCase() === 'RU') {
    url.hostname = 'sgiprealestate.ru'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico|robots.txt|sitemap.xml).*)'],
}


