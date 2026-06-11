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

    // 2. Find the active shift
    const { data: activeShift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .is('clock_out', null)
      .maybeSingle()

    if (shiftError) {
      console.error('Database error fetching active shift:', shiftError)
      return NextResponse.json(
        { data: null, error: 'Internal Server Error: Database unavailable' },
        { status: 500 }
      )
    }

    if (!activeShift) {
      return NextResponse.json(
        { data: null, error: 'Bad Request: No active shift found. You must clock in first.' },
        { status: 400 }
      )
    }

    // 3. Calculate duration
    const clockInDate = new Date(activeShift.clock_in)
    const clockOutDate = new Date()
    const durationMs = clockOutDate.getTime() - clockInDate.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))

    // Format duration string: "X hours Y minutes"
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    let durationFormatted = ''
    if (hours > 0) {
      durationFormatted += `${hours} hour${hours > 1 ? 's' : ''} `
    }
    durationFormatted += `${minutes} minute${minutes !== 1 ? 's' : ''}`
    durationFormatted = durationFormatted.trim()

    // 4. Update the record
    const { data: updatedShift, error: updateError } = await supabase
      .from('shifts')
      .update({
        clock_out: clockOutDate.toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', activeShift.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Database error updating shift:', updateError)
      return NextResponse.json(
        { data: null, error: 'Internal Server Error: Failed to clock out' },
        { status: 500 }
      )
    }

    // 5. Return 200 with the updated record + dynamic formatted string
    const responseData = {
      ...updatedShift,
      duration_formatted: durationFormatted
    }

    return NextResponse.json({ data: responseData, error: null }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error in clock-out route:', err)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error: Unexpected failure' },
      { status: 500 }
    )
  }
}
