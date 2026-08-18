import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Keep the legacy event detail URL usable for anonymous visitors.
  // Authenticated users remain on the protected event management page.
  const publicEventMatch = request.nextUrl.pathname.match(/^\/events\/([^/]+)$/)
  if (!user && publicEventMatch) {
    const url = request.nextUrl.clone()
    url.pathname = `/event/${publicEventMatch[1]}`
    return NextResponse.redirect(url)
  }

  // Public routes: login page, registration, client portal, public event detail, certificate verification
  const isPublic =
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/daftar') ||
    request.nextUrl.pathname.startsWith('/client') ||
    request.nextUrl.pathname === '/event' ||
    request.nextUrl.pathname.startsWith('/event/') ||
    request.nextUrl.pathname.startsWith('/verify')
  const isStaticAsset = request.nextUrl.pathname.includes('.')

  if (!user && !isPublic && !isStaticAsset) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
