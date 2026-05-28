import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/admin-session'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Protect all /admin/* routes except the login page itself
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token || !(await verifySessionToken(token))) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Strip legacy Shopify query params from product URLs
  if (
    pathname.startsWith('/products/') &&
    (searchParams.has('country') || searchParams.has('currency'))
  ) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('country')
    url.searchParams.delete('currency')
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/products/:path*', '/admin/:path*'],
}
