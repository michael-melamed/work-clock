import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/automation/locations/[id]
 * Deletes a work location owned by the current user.
 * If this location was the active_location_id in automation_settings,
 * that field is set to null automatically (via ON DELETE SET NULL in DB).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('work_locations')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/automation/locations/[id]
 * Updates a work location (name, radius, is_active).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const body: Partial<{ name: string; radius_meters: number; is_active: boolean }> =
      await req.json()

    const { error } = await supabase
      .from('work_locations')
      .update(body)
      .eq('id', params.id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ data: null, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
