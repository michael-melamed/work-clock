'use client'

import { useState, useCallback } from 'react'
import { useAutomation } from '@/hooks/useAutomation'
import { useGeofence } from '@/hooks/useGeofence'
import { useShift } from '@/hooks/useShift'
import Link from 'next/link'
import type { AutomationMode, WorkLocation } from '@/types/automation'
import { DAY_LABELS } from '@/types/automation'

/** Haptic feedback utility */
const haptic = (ms = 40) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms)
}

/** Toggle button for work days */
function DayToggle({
  day,
  selected,
  onToggle,
}: {
  day: number
  selected: boolean
  onToggle: (day: number) => void
}) {
  return (
    <button
      onClick={() => { haptic(); onToggle(day) }}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
        selected
          ? 'bg-emerald-500 text-white shadow-[0_0_12px_-2px_rgba(16,185,129,0.5)]'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
      }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {DAY_LABELS[day].slice(0, 1)}
    </button>
  )
}

/** Single location row in the list */
function LocationRow({
  loc,
  isActive,
  onSelect,
  onDelete,
}: {
  loc: WorkLocation
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all ${
        isActive
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-slate-800/50 border-slate-700/30'
      }`}
    >
      <button
        onClick={() => { haptic(); onSelect(loc.id) }}
        className="flex flex-1 flex-col items-start gap-0.5 text-right"
      >
        <span className="text-sm font-semibold text-slate-100">{loc.name}</span>
        <span className="text-xs text-slate-400">
          {loc.radius_meters}מ׳ רדיוס · {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
        </span>
      </button>
      <button
        onClick={() => { haptic(60); onDelete(loc.id) }}
        className="mr-3 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
        aria-label="מחק מיקום"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/** Section card wrapper */
function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/60">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-bold text-slate-200">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

/** Inline toggle row */
function ToggleRow({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string
  sublabel?: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
      </div>
      <button
        onClick={() => { haptic(); onChange(!checked) }}
        className={`relative flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-slate-700'
        }`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, locations, isLoading, isSaving, error, updateSettings, addLocation, deleteLocation, subscribeToPush } =
    useAutomation()
  const { clockIn } = useShift()

  // Local state for the add-location form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLocName, setNewLocName] = useState('')
  const [newLocRadius, setNewLocRadius] = useState('100')
  const [locError, setLocError] = useState<string | null>(null)

  // Geofence suggestion toast state
  const [showGeofenceSuggest, setShowGeofenceSuggest] = useState(false)

  // Find the active location object for geofencing
  const activeLocation = locations.find(l => l.id === settings?.active_location_id) ?? null

  // Geofence hook — runs while app is open and geofence is enabled
  const handleEnter = useCallback(() => {
    if (!settings?.geofence_enabled) return
    if (settings.automation_mode === 'auto') {
      clockIn()
    } else {
      setShowGeofenceSuggest(true)
    }
  }, [settings, clockIn])

  const handleExit = useCallback(() => {
    // Could suggest clock-out — kept minimal for now
  }, [])

  useGeofence({
    location: activeLocation,
    enabled: !!(settings?.geofence_enabled && activeLocation),
    onEnter: handleEnter,
    onExit: handleExit,
    intervalMs: 30_000,
  })

  // Toggle a day in/out of work_days array
  const toggleDay = useCallback(
    (day: number) => {
      if (!settings) return
      const current = settings.work_days ?? []
      const updated = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day].sort((a, b) => a - b)
      updateSettings({ work_days: updated })
    },
    [settings, updateSettings]
  )

  // Locate the user's current GPS position and use it as the new location
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError('GPS אינו זמין בדפדפן זה')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const name = newLocName.trim() || 'מקום עבודה'
        addLocation({
          name,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          radius_meters: parseInt(newLocRadius, 10) || 100,
        }).then(() => {
          setShowAddForm(false)
          setNewLocName('')
          setLocError(null)
        })
      },
      () => setLocError('לא ניתן לקבל מיקום. אפשר גישה ב-GPS.')
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16]" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="text-sm text-slate-400">טוען הגדרות...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#090d16] text-slate-100" dir="rtl">

      {/* Background glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-indigo-600/8 blur-[100px]" />

      {/* Header */}
      <header className="relative z-10 px-4 pt-5 pb-4">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => haptic()}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-slate-100">הגדרות אוטומציה</h1>
        </div>
      </header>

      {/* Geofence suggestion toast */}
      {showGeofenceSuggest && (
        <div className="fixed top-20 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="rounded-2xl bg-slate-900 border border-emerald-500/30 p-4 shadow-2xl">
            <p className="text-sm font-semibold text-slate-100 mb-3">📍 הגעת למקום העבודה!</p>
            <p className="text-xs text-slate-400 mb-4">האם להתחיל משמרת?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { haptic(); clockIn(); setShowGeofenceSuggest(false) }}
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white"
              >
                ✅ התחל משמרת
              </button>
              <button
                onClick={() => { haptic(); setShowGeofenceSuggest(false) }}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-bold text-slate-300"
              >
                לא עכשיו
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 space-y-4 px-4 pb-32">

        {/* Error banner */}
        {error && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-medium text-rose-300">
            {error}
          </div>
        )}

        {/* ─── 1. Automation Mode ─── */}
        <SectionCard title="מצב אוטומציה" icon="⚙️">
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-300">הצעה</strong> — האפליקציה שולחת התראה ושואלת לפני שמתחילה משמרת.{' '}
            <strong className="text-slate-300">אוטומטי</strong> — מתחיל/מסיים ישירות.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['suggest', 'auto'] as AutomationMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => { haptic(); updateSettings({ automation_mode: mode }) }}
                className={`rounded-xl py-3 text-sm font-bold transition-all border ${
                  settings?.automation_mode === mode
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/30 hover:bg-slate-800'
                }`}
              >
                {mode === 'suggest' ? '🙋 הצעה בלבד' : '🤖 אוטומטי'}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ─── 2. Schedule ─── */}
        <SectionCard title="לוח זמנים" icon="📅">
          <ToggleRow
            label="אפשר תזמון"
            sublabel="שלח התראה בשעה קבועה בימי עבודה"
            checked={settings?.schedule_enabled ?? false}
            onChange={val => updateSettings({ schedule_enabled: val })}
          />

          {settings?.schedule_enabled && (
            <>
              {/* Work days */}
              <div>
                <p className="mb-2 text-xs font-medium text-slate-400">ימי עבודה</p>
                <div className="flex gap-1.5" dir="ltr">
                  {[0, 1, 2, 3, 4, 5, 6].map(day => (
                    <DayToggle
                      key={day}
                      day={day}
                      selected={settings.work_days?.includes(day) ?? false}
                      onToggle={toggleDay}
                    />
                  ))}
                </div>
              </div>

              {/* Start time */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200" htmlFor="start-time">
                  שעת התחלה
                </label>
                <input
                  id="start-time"
                  type="time"
                  value={settings.default_start_time ?? '08:00'}
                  onChange={e => updateSettings({ default_start_time: e.target.value })}
                  className="rounded-xl bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* End time */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200" htmlFor="end-time">
                  שעת סיום <span className="text-xs text-slate-500">(אופציונלי)</span>
                </label>
                <input
                  id="end-time"
                  type="time"
                  value={settings.default_end_time ?? ''}
                  onChange={e =>
                    updateSettings({ default_end_time: e.target.value || null })
                  }
                  className="rounded-xl bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Offset */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-200" htmlFor="offset">
                  תזכורת מוקדמת
                </label>
                <select
                  id="offset"
                  value={settings.reminder_offset_minutes ?? 0}
                  onChange={e => updateSettings({ reminder_offset_minutes: parseInt(e.target.value) })}
                  className="rounded-xl bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value={0}>בדיוק בשעה</option>
                  <option value={5}>5 דקות לפני</option>
                  <option value={10}>10 דקות לפני</option>
                  <option value={15}>15 דקות לפני</option>
                </select>
              </div>
            </>
          )}
        </SectionCard>

        {/* ─── 3. Geofence ─── */}
        <SectionCard title="מיקום אוטומטי" icon="📍">
          <p className="text-xs text-slate-500 leading-relaxed">
            זיהוי כניסה/יציאה ממקום העבודה. פועל רק כשהאפליקציה פתוחה (מגבלת PWA).
          </p>

          <ToggleRow
            label="אפשר זיהוי מיקום"
            sublabel="דורש הרשאת GPS"
            checked={settings?.geofence_enabled ?? false}
            onChange={val => updateSettings({ geofence_enabled: val })}
          />

          {settings?.geofence_enabled && (
            <ToggleRow
              label="רק בשעות עבודה"
              sublabel="הפעל רק בימים ושעות שהוגדרו בלוח הזמנים"
              checked={settings.geofence_require_schedule_window ?? true}
              onChange={val => updateSettings({ geofence_require_schedule_window: val })}
            />
          )}

          {/* Location list */}
          <div className="space-y-2">
            {locations.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-2">
                אין מיקומים שמורים עדיין.
              </p>
            )}
            {locations.map(loc => (
              <LocationRow
                key={loc.id}
                loc={loc}
                isActive={settings?.active_location_id === loc.id}
                onSelect={id => updateSettings({ active_location_id: id })}
                onDelete={deleteLocation}
              />
            ))}
          </div>

          {/* Add location */}
          {!showAddForm ? (
            <button
              onClick={() => { haptic(); setShowAddForm(true) }}
              className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm font-medium text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
            >
              + הוסף מיקום עבודה
            </button>
          ) : (
            <div className="space-y-3 rounded-xl bg-slate-800/50 border border-slate-700/40 p-4">
              <input
                type="text"
                placeholder="שם המיקום (למשל: משרד)"
                value={newLocName}
                onChange={e => setNewLocName(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700/50 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 shrink-0">רדיוס (מ׳):</label>
                <select
                  value={newLocRadius}
                  onChange={e => setNewLocRadius(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="50">50 מ׳</option>
                  <option value="100">100 מ׳ (ברירת מחדל)</option>
                  <option value="200">200 מ׳</option>
                  <option value="500">500 מ׳</option>
                </select>
              </div>
              {locError && <p className="text-xs text-rose-400">{locError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={useCurrentLocation}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  📍 השתמש במיקומי
                </button>
                <button
                  onClick={() => { haptic(); setShowAddForm(false); setLocError(null) }}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-700 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ─── 4. Protection ─── */}
        <SectionCard title="הגנה על שכחה" icon="🛡️">
          <ToggleRow
            label="סגירה אוטומטית"
            sublabel={`סגור משמרת לאחר ${settings?.auto_clock_out_after_hours ?? 12} שעות אם שכחת`}
            checked={settings?.auto_clock_out_enabled ?? false}
            onChange={val => updateSettings({ auto_clock_out_enabled: val })}
          />

          {settings?.auto_clock_out_enabled && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-200" htmlFor="auto-hours">
                לאחר כמה שעות
              </label>
              <select
                id="auto-hours"
                value={settings.auto_clock_out_after_hours ?? 12}
                onChange={e => updateSettings({ auto_clock_out_after_hours: parseInt(e.target.value) })}
                className="rounded-xl bg-slate-800 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                {[6, 8, 10, 12, 14, 16].map(h => (
                  <option key={h} value={h}>{h} שעות</option>
                ))}
              </select>
            </div>
          )}

          <ToggleRow
            label="תזכורות חוזרות"
            sublabel="שלח תזכורת כל שעה אם המשמרת עדיין פתוחה"
            checked={settings?.forgotten_shift_reminders ?? true}
            onChange={val => updateSettings({ forgotten_shift_reminders: val })}
          />
        </SectionCard>

        {/* ─── 5. Push Notifications ─── */}
        <SectionCard title="התראות Push" icon="🔔">
          {settings?.push_subscription ? (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="text-xs text-slate-300 font-medium">מנוי פעיל — התראות מאופשרות</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400 leading-relaxed">
                הרשם לקבלת התראות כשהגיע זמן להתחיל או לסיים משמרת.
                נדרשת אישור הרשאה.
              </p>
              <button
                onClick={subscribeToPush}
                disabled={isSaving}
                className="w-full rounded-xl bg-indigo-500/15 border border-indigo-500/30 py-3 text-sm font-bold text-indigo-400 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
              >
                🔔 הפעל התראות
              </button>
            </>
          )}
        </SectionCard>

        {/* Saving indicator */}
        {isSaving && (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <span className="text-xs text-slate-500">שומר...</span>
          </div>
        )}
      </main>

      {/* Bottom Navigation — matches rest of app */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[320px] max-w-[92%]">
        <div className="flex items-center justify-around px-4 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-lg border border-slate-800/80 shadow-2xl">
          <Link
            href="/"
            onClick={() => haptic()}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">דשבורד</span>
          </Link>
          <Link
            href="/history"
            onClick={() => haptic()}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">היסטוריה</span>
          </Link>
          <div className="flex flex-col items-center justify-center text-emerald-400 cursor-default">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5">הגדרות</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
