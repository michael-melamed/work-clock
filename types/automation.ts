/**
 * types/automation.ts
 * TypeScript types for the shift automation system.
 * Covers schedule-based and geofence-based triggers.
 */

export type AutomationMode = 'suggest' | 'auto'

/** A saved workplace location used for geofencing */
export interface WorkLocation {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
  is_active: boolean
  created_at: string
}

/** Full automation settings row (mirrors DB schema) */
export interface AutomationSettings {
  id: string
  user_id: string
  schedule_enabled: boolean
  work_days: number[]               // 0=Sun, 1=Mon, ..., 6=Sat
  default_start_time: string        // "HH:MM" format (Postgres time)
  default_end_time: string | null
  reminder_offset_minutes: number
  geofence_enabled: boolean
  active_location_id: string | null
  geofence_require_schedule_window: boolean
  automation_mode: AutomationMode
  auto_clock_out_enabled: boolean
  auto_clock_out_after_hours: number
  forgotten_shift_reminders: boolean
  push_subscription: PushSubscriptionJSON | null
  updated_at: string
}

/** Partial update payload (omits server-controlled fields) */
export type AutomationSettingsUpdate = Partial<
  Omit<AutomationSettings, 'id' | 'user_id' | 'updated_at'>
>

/** Fired when user enters/exits a geofenced work location */
export interface GeofenceEvent {
  type: 'enter' | 'exit'
  location: WorkLocation
  timestamp: string
}

/** Push notification trigger type (used by /api/automation/trigger) */
export type AutomationTriggerType =
  | 'schedule_start'
  | 'schedule_end'
  | 'forgotten_clock_out'

/** Payload sent to /api/automation/trigger */
export interface AutomationTriggerPayload {
  userId: string
  triggerType: AutomationTriggerType
}

/** Day label map for display in the UI */
export const DAY_LABELS: Record<number, string> = {
  0: 'ראשון',
  1: 'שני',
  2: 'שלישי',
  3: 'רביעי',
  4: 'חמישי',
  5: 'שישי',
  6: 'שבת',
}
