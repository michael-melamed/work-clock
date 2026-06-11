import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export async function GET(request: Request): Promise<NextResponse<ApiResponse>> {
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

    // Parse ?limit= parameter
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 30

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { data: null, error: 'Bad Request: limit must be a positive integer' },
        { status: 400 }
      )
    }

    // 2. Fetch completed shifts
    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select('id, clock_in, clock_out, duration_minutes')
      .eq('user_id', userId)
      .not('clock_out', 'is', null)
      .order('clock_in', { ascending: false })
      .limit(limit)

    if (shiftsError) {
      console.error('Database error fetching shift history:', shiftsError)
      return NextResponse.json(
        { data: null, error: 'Internal Server Error: Database unavailable' },
        { status: 500 }
      )
    }

    // 3. Format duration
    const formattedShifts = shifts.map(shift => {
      let durationFormatted = ''
      if (shift.duration_minutes !== null && shift.duration_minutes !== undefined) {
        const hours = Math.floor(shift.duration_minutes / 60)
        const minutes = shift.duration_minutes % 60
        if (hours > 0) {
          durationFormatted += `${hours} hour${hours > 1 ? 's' : ''} `
        }
        durationFormatted += `${minutes} minute${minutes !== 1 ? 's' : ''}`
        durationFormatted = durationFormatted.trim()
      }

      return {
        ...shift,
        duration_formatted: durationFormatted || null
      }
    })

    return NextResponse.json({ data: formattedShifts, error: null }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error in history route:', err)
    return NextResponse.json(
      { data: null, error: 'Internal Server Error: Unexpected failure' },
      { status: 500 }
    )
  }
}
