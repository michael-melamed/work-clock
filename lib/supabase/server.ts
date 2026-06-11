import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Supabase client for use in Server Components and Route Handlers.
 * Reads the session from the request cookie store via next/headers.
 *
 * Usage (Server Component or Route Handler):
 *   const supabase = createSupabaseServerClient()
 *   const { data: { session } } = await supabase.auth.getSession()
 *
 * ⚠️ Never import this in Client Components — next/headers is server-only.
 * ⚠️ Never expose SUPABASE_SERVICE_ROLE_KEY via this client.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
