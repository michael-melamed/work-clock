import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successful login, redirect to home page
      // The middleware will allow access if session is valid
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
  }

  // Fallback if no code is present or there was an error
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
}
