import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createSupabaseServerClient()
    
    // 1. Check session
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized: No active session' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 2. Find the active shift
    const { data: activeShift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .is('clock_out', null)
      .maybeSingle()

    if (shiftError) {
      console.error('Database error fetching active shift status:', shiftError)
      return NextResponse.json(
        { data: null, error: 'Internal Server Error: Database unavailable' },
        { status: 500 }
      )
    }

    // 3. Return status
    if (activeShift) {
      return NextResponse.json(
        { data: { active: true, shift: activeShift }, error: null },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { data: { active: false, shift: null }, error: null },
        { status: 200 }
      )
    }

  } catch (err) {
    console.error('Unexpected error in status route:', err)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error: Unexpected failure' },
      { status: 500 }
    )
  }
}
