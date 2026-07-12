import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client scoped to the middleware request/response cycle.
 * Uses getAll/setAll so that refreshed tokens are written back into the response.
 *
 * Must be called on every matched request so the session cookie is refreshed
 * before it expires.
 *
 * Usage (inside middleware.ts):
 *   const { supabase, response } = createSupabaseMiddlewareClient(req)
 *   await supabase.auth.getSession()   // ← refreshes the token
 *   return response                    // ← forward the updated Set-Cookie header
 */
export function createSupabaseMiddlewareClient(req: NextRequest) {
  // We build the response here so cookie writes land on it
  let response = NextResponse.next({
    request: { headers: req.headers },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to both the outgoing request (for subsequent middleware)
          // and the outgoing response (for the browser)
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: req.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}
