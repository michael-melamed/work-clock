import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import type { AutomationTriggerPayload } from '@/types/automation'
import type { ApiResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * POST /api/automation/trigger
 *
 * Internal endpoint called by Vercel Cron Jobs or other server-side processes.
 * Secured by the CRON_SECRET header — NOT accessible to client code.
 *
 * What it does:
 *  1. schedule_start  → checks if user should start a shift now, sends push (suggest/auto)
 *  2. schedule_end    → sends an end-of-shift reminder if shift is still active
 *  3. forgotten_clock_out → fires if shift has been active longer than auto_clock_out_after_hours
 *
 * For 'auto' mode: performs clock-in/out directly, then notifies.
 * For 'suggest' mode: only sends a push notification with action buttons.
 */
export async function POST(req: Request): Promise<NextResponse<ApiResponse<{ sent: number }>>> {
  // Verify internal secret to prevent abuse
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body: AutomationTriggerPayload = await req.json()
    const { userId, triggerType } = body

    if (!userId || !triggerType) {
      return NextResponse.json({ data: null, error: 'userId and triggerType are required' }, { status: 400 })
    }

    // Use service-role client — bypasses RLS for internal operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Fetch the user's automation settings
    const { data: settings, error: settingsError } = await supabase
      .from('automation_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (settingsError) throw settingsError
    if (!settings) {
      return NextResponse.json({ data: { sent: 0 }, error: null })
    }

    // Skip if no push subscription registered
    if (!settings.push_subscription) {
      return NextResponse.json({ data: { sent: 0 }, error: null })
    }

    let notificationTitle = ''
    let notificationBody = ''
    let actions: { action: string; title: string }[] = []

    if (triggerType === 'schedule_start') {
      if (!settings.schedule_enabled) {
        return NextResponse.json({ data: { sent: 0 }, error: null })
      }

      if (settings.automation_mode === 'auto') {
        // Auto mode: clock in directly via existing endpoint
        await supabase.from('shifts').insert({ user_id: userId, clock_in: new Date().toISOString() })
        notificationTitle = '⏱️ משמרת התחילה'
        notificationBody = 'הכניסה למשמרת נרשמה אוטומטית. לחץ לפתוח.'
        actions = []
      } else {
        // Suggest mode: send actionable notification
        notificationTitle = '🕐 הגיע זמן המשמרת'
        notificationBody = 'האם אתה במקום העבודה? לחץ להתחלת משמרת.'
        actions = [
          { action: 'clock-in-now', title: '✅ התחל משמרת' },
          { action: 'remind-later', title: '⏰ תזכיר בעוד 15 דקות' },
        ]
      }
    } else if (triggerType === 'schedule_end') {
      notificationTitle = '🔔 סיום משמרת?'
      notificationBody = 'הגיע הזמן לסיים את המשמרת. לחץ לרישום יציאה.'
      actions = [
        { action: 'clock-out-now', title: '🏁 סיים משמרת' },
        { action: 'dismiss', title: 'עוד לא' },
      ]
    } else if (triggerType === 'forgotten_clock_out') {
      notificationTitle = '⚠️ שכחת לסגור משמרת?'
      notificationBody = `המשמרת פתוחה כבר ${settings.auto_clock_out_after_hours} שעות. לחץ לסגירה.`
      actions = [
        { action: 'clock-out-now', title: '🏁 סיים עכשיו' },
        { action: 'dismiss', title: 'אני יודע' },
      ]

      // Auto clock-out if enabled
      if (settings.auto_clock_out_enabled && settings.automation_mode === 'auto') {
        const { data: activeShift } = await supabase
          .from('shifts')
          .select('id, clock_in')
          .eq('user_id', userId)
          .is('clock_out', null)
          .maybeSingle()

        if (activeShift) {
          const clockOutTime = new Date()
          const durationMinutes = Math.round(
            (clockOutTime.getTime() - new Date(activeShift.clock_in).getTime()) / 60000
          )
          await supabase
            .from('shifts')
            .update({
              clock_out: clockOutTime.toISOString(),
              duration_minutes: durationMinutes,
            })
            .eq('id', activeShift.id)

          notificationTitle = '⏹️ משמרת נסגרה אוטומטית'
          notificationBody = `עבדת ${Math.floor(durationMinutes / 60)}:${String(durationMinutes % 60).padStart(2, '0')} שעות.`
          actions = []
        }
      }
    }

    // Configure web-push with VAPID keys (should be done once, but Next.js serverless functions can re-initialize)
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@workclock.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    // Send the push notification
    if (notificationTitle && settings.push_subscription) {
      try {
        const payload = JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          actions,
        })
        
        // Settings stores the push_subscription as a JSON object, but the DB column is JSONB
        // We cast it to the type expected by web-push
        const pushSubscription = settings.push_subscription as webpush.PushSubscription
        
        await webpush.sendNotification(pushSubscription, payload)
        console.log(`[automation/trigger] Successfully sent push to user ${userId}`)
      } catch (pushError) {
        console.error(`[automation/trigger] Failed to send push to user ${userId}:`, pushError)
        return NextResponse.json({ data: { sent: 0 }, error: 'Failed to send push' }, { status: 500 })
      }
    }

    return NextResponse.json({ data: { sent: 1 }, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
