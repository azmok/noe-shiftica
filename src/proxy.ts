import { NextResponse, type NextRequest } from 'next/server'

/**
 * Sends the native Payload admin login (`/admin/login`) to our custom 2-step
 * login (`/2fa-login`, password + passkey).
 *
 * Break-glass: setting the `DISABLE_2FA` env var leaves the native login intact
 * so an admin can always get back in if the 2FA flow ever breaks.
 *
 * (Next.js 16 renamed the `middleware` convention to `proxy`.)
 */
export function proxy(request: NextRequest) {
  if (process.env.DISABLE_2FA === 'true') return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/2fa-login'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/login'],
}
