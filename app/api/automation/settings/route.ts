import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AutomationSettings, AutomationSettingsUpdate } from '@/types/automation'
import type { ApiResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/automation/settings
 * Returns the current user's automation settings.
 * Creates a default row if none exists yet.
 */
export async function GET(): Promise<NextResponse<ApiResponse<AutomationSettings>>> {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch existing row
    const { data, error } = await supabase
      .from('automation_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    // If no row exists, create defaults and return them
    if (!data) {
      const { data: created, error: createError } = await supabase
        .from('automation_settings')
        .insert({ user_id: userId })
        .select()
        .single()

      if (createError) throw createError

      return NextResponse.json({ data: created as AutomationSettings, error: null })
    }

    return NextResponse.json({ data: data as AutomationSettings, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

/**
 * PUT /api/automation/settings
 * Updates the current user's automation settings (upserts).
 */
export async function PUT(req: Request): Promise<NextResponse<ApiResponse<AutomationSettings>>> {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body: AutomationSettingsUpdate = await req.json()

    // Upsert — inserts if not exists, updates otherwise
    const { data, error } = await supabase
      .from('automation_settings')
      .upsert({ user_id: userId, ...body }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: data as AutomationSettings, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
