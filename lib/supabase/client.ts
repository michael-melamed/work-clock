import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

/**
 * Supabase client for use in Client Components (browser).
 * Reads and writes the session via the browser cookie store automatically.
 *
 * Usage:
 *   'use client'
 *   const supabase = createSupabaseBrowserClient()
 *
 * ⚠️ Never use this in Server Components or Route Handlers.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
