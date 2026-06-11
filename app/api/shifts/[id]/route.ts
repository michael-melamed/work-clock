import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
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
    const shiftId = params.id

    // 2. Parse and validate body
    const body = await request.json()
    const { clock_in, clock_out } = body

    if (!clock_in) {
      return NextResponse.json(
        { data: null, error: 'Bad Request: clock_in is required' },
        { status: 400 }
      )
    }

    const clockInDate = new Date(clock_in)
    if (isNaN(clockInDate.getTime())) {
      return NextResponse.json(
        { data: null, error: 'Bad Request: Invalid clock_in date' },
        { status: 400 }
      )
    }

    let clockOutDate: Date | null = null
    let durationMinutes: number | null = null
    let durationFormatted = ''

    if (clock_out) {
      clockOutDate = new Date(clock_out)
      if (isNaN(clockOutDate.getTime())) {
        return NextResponse.json(
          { data: null, error: 'Bad Request: Invalid clock_out date' },
          { status: 400 }
        )
      }

      if (clockOutDate < clockInDate) {
        return NextResponse.json(
          { data: null, error: 'Bad Request: clock_out must be after clock_in' },
          { status: 400 }
        )
      }

      const durationMs = clockOutDate.getTime() - clockInDate.getTime()
      durationMinutes = Math.floor(durationMs / (1000 * 60))

      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      if (hours > 0) {
        durationFormatted += `${hours} hour${hours > 1 ? 's' : ''} `
      }
      durationFormatted += `${minutes} minute${minutes !== 1 ? 's' : ''}`
      durationFormatted = durationFormatted.trim()
    }

    // 3. Update in Database
    const { data: updatedShift, error: updateError } = await supabase
      .from('shifts')
      .update({
        clock_in: clockInDate.toISOString(),
        clock_out: clockOutDate ? clockOutDate.toISOString() : null,
        duration_minutes: durationMinutes
      })
      .eq('id', shiftId)
      .eq('user_id', userId) // Security: check owner
      .select('*')
      .single()

    if (updateError) {
      console.error('Database error updating shift:', updateError)
      return NextResponse.json(
        { data: null, error: 'Internal Server Error: Failed to update shift' },
        { status: 500 }
      )
    }

    const responseData = {
      ...updatedShift,
      duration_formatted: durationFormatted || null
    }

    return NextResponse.json({ data: responseData, error: null }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error in shift PATCH route:', err)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error: Unexpected failure' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
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
    const shiftId = params.id

    // 2. Delete from Database
    const { error: deleteError } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId)
      .eq('user_id', userId) // Security: check owner

    if (deleteError) {
      console.error('Database error deleting shift:', deleteError)
      return NextResponse.json(
        { data: null, error: 'Internal Server Error: Failed to delete shift' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: true, error: null }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error in shift DELETE route:', err)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error: Unexpected failure' },
      { status: 500 }
    )
  }
}
