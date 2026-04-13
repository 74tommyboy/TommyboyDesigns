import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl

  if (searchParams.has('country') || searchParams.has('currency')) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('country')
    url.searchParams.delete('currency')
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/products/:path*',
}
