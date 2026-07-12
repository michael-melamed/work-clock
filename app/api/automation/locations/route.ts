import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { WorkLocation } from '@/types/automation'
import type { ApiResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/automation/locations
 * Returns all work locations for the current user.
 */
export async function GET(): Promise<NextResponse<ApiResponse<WorkLocation[]>>> {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('work_locations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: (data ?? []) as WorkLocation[], error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

/**
 * POST /api/automation/locations
 * Adds a new work location for the current user.
 */
export async function POST(req: Request): Promise<NextResponse<ApiResponse<WorkLocation>>> {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const body: { name: string; latitude: number; longitude: number; radius_meters?: number } =
      await req.json()

    if (!body.name || body.latitude == null || body.longitude == null) {
      return NextResponse.json(
        { data: null, error: 'name, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('work_locations')
      .insert({
        user_id: session.user.id,
        name: body.name.trim(),
        latitude: body.latitude,
        longitude: body.longitude,
        radius_meters: body.radius_meters ?? 100,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: data as WorkLocation, error: null }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
