import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export async function POST(): Promise<NextResponse<ApiResponse>> {
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

    // 2. Check that there is no active shift
    const { data: activeShift, error: activeShiftError } = await supabase
      .from('shifts')
      .select('id')
      .eq('user_id', userId)
      .is('clock_out', null)
      .maybeSingle()

    // Handle DB unavailability or querying errors
    if (activeShiftError) {
      console.error('Database error checking active shifts:', activeShiftError)
      return NextResponse.json(
        { data: null, error: 'Internal Server Error: Database unavailable' },
        { status: 500 }
      )
    }

    if (activeShift) {
      return NextResponse.json(
        { data: null, error: 'Bad Request: You already have an active shift. Please clock out first.' },
        { status: 400 }
      )
    }

    // 3. Create a new shift record
    const { data: newShift, error: insertError } = await supabase
      .from('shifts')
      .insert([
        {
          user_id: userId,
          clock_in: new Date().toISOString(),
        }
      ])
      .select('*')
      .single()

    // Handle DB failure on insert
    if (insertError) {
      console.error('Database error inserting shift:', insertError)
      return NextResponse.json(
        { data: null, error: 'Internal Server Error: Failed to create shift' },
        { status: 500 }
      )
    }

    // 4. Return 201 with created record
    return NextResponse.json({ data: newShift, error: null }, { status: 201 })

  } catch (err) {
    console.error('Unexpected error in clock-in route:', err)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error: Unexpected failure' },
      { status: 500 }
    )
  }
}
