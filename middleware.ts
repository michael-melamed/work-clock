import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'

/**
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session cookie (prevents silent log-outs)
 *  2. Redirect unauthenticated users away from protected routes → /login
 *
 * Protected routes : /  and  /history/*
 * Open routes      : /login  and  /auth/callback  (and everything else)
 */
export async function middleware(req: NextRequest) {
  // Attach the Supabase client to this request/response pair and refresh token
  const { supabase, response } = createSupabaseMiddlewareClient(req)

  // getSession() will silently refresh an expired token and write the new
  // cookie into `response` — always await it, even if you don't use the result.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect to /login
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Session is valid — continue with the (possibly refreshed) response
  return response
}

/**
 * Route matcher — only runs middleware on these paths.
 *
 * Note: Next.js route groups like (app) do NOT appear in the URL,
 * so protecting '/' and '/history/:path*' is sufficient to guard
 * everything under app/(app)/.
 */
export const config = {
  matcher: ['/', '/history/:path*'],
}
