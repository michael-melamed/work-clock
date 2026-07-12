'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHistory } from '@/hooks/useHistory'
import { ShiftCard } from '@/components/features/ShiftCard'
import type { CompletedShift } from '@/hooks/useShift'

// Convert ISO string to YYYY-MM-DDTHH:MM format in local timezone for datetime-local input
function toLocalDatetimeInput(isoString: string | null | undefined): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Group shifts by calendar date (YYYY-MM-DD)
function groupByDate(shifts: CompletedShift[]): [string, CompletedShift[]][] {
  const map = new Map<string, CompletedShift[]>()
  for (const shift of shifts) {
    const key = new Date(shift.clock_in).toLocaleDateString('sv-SE') // YYYY-MM-DD
    const group = map.get(key) ?? []
    group.push(shift)
    map.set(key, group)
  }
  return Array.from(map.entries())
}

function formatGroupHeader(dateKey: string): string {
  const d = new Date(dateKey)
  return d.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Calculate total hours and minutes in a list of shifts
function calculateTotalTime(shiftsList: CompletedShift[]): { hours: number; minutes: number } {
  const totalMinutes = shiftsList.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes }
}

// Format daily total label
function calculateDailyTotalLabel(shiftsList: CompletedShift[]): string {
  const { hours, minutes } = calculateTotalTime(shiftsList)
  if (hours === 0) {
    if (minutes === 1) return 'דקה אחת'
    return `${minutes} דקות`
  }
  
  if (minutes === 0) {
    if (hours === 1) return 'שעה אחת'
    return `${hours} שעות`
  }
  
  const hoursPart = hours === 1 ? 'שעה אחת' : `${hours} שעות`
  const minsPart = minutes === 1 ? 'דקה אחת' : `${minutes} דקות`
  return `${hoursPart} ו-${minsPart}`
}

// Skeleton loader — 3 placeholder cards
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800 sm:p-5">
      <div className="mb-3 flex justify-between">
        <div className="h-4 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-4 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex justify-end">
        <div className="h-6 w-28 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { shifts, isLoading, error, refresh, updateShift, deleteShift } = useHistory(30)
  
  // Edit modal state
  const [selectedShift, setSelectedShift] = useState<CompletedShift | null>(null)
  const [clockInInput, setClockInInput] = useState('')
  const [clockOutInput, setClockOutInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const openEditModal = (shift: CompletedShift) => {
    setSelectedShift(shift)
    setClockInInput(toLocalDatetimeInput(shift.clock_in))
    setClockOutInput(toLocalDatetimeInput(shift.clock_out))
    setModalError(null)
  }

  const closeEditModal = () => {
    setSelectedShift(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShift) return
    setIsSaving(true)
    setModalError(null)

    try {
      const clockInIso = new Date(clockInInput).toISOString()
      const clockOutIso = clockOutInput ? new Date(clockOutInput).toISOString() : ''

      const result = await updateShift(selectedShift.id, clockInIso, clockOutIso)
      if (result.success) {
        closeEditModal()
      } else {
        setModalError(result.error || 'שגיאה בעדכון המשמרת')
      }
    } catch (err: any) {
      setModalError('אנא וודא שהתאריכים שהזנת תקינים')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedShift) return
    if (!confirm('האם אתה בטוח שברצונך למחוק משמרת זו?')) return

    setIsDeleting(true)
    setModalError(null)

    const result = await deleteShift(selectedShift.id)
    setIsDeleting(false)

    if (result.success) {
      closeEditModal()
    } else {
      setModalError(result.error || 'שגיאה במחיקת המשמרת')
    }
  }

  // Calculate monthly summary
  const monthlySummary = calculateTotalTime(shifts)

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60)
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-28 select-none" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-panel shadow-md border-b border-slate-800/40">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link
            href="/"
            onClick={triggerHaptic}
            className="flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label="חזרה לדשבורד"
          >
            {/* Arrow pointing right for RTL back navigation */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <h1 className="text-base font-bold text-slate-200">היסטוריית משמרות</h1>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-6">

        {/* Monthly Summary Widget */}
        {!isLoading && !error && shifts.length > 0 && (
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-white shadow-xl border border-slate-800/60 animate-in fade-in slide-in-from-top-3 duration-300">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">סיכום 30 המשמרות האחרונות</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {monthlySummary.hours}
              </span>
              <span className="text-xs font-semibold text-slate-400">שעות</span>
              <span className="text-3xl font-black text-emerald-400 font-mono mr-3">
                {monthlySummary.minutes}
              </span>
              <span className="text-xs font-semibold text-slate-400">דקות</span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              מחושב דינמית על בסיס {shifts.length} רשומות
            </p>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-slate-400 text-sm">אירעה שגיאה בטעינת ההיסטוריה</p>
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">{error}</p>
            <button
              onClick={() => { triggerHaptic(); refresh(); }}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-600 focus:outline-none"
            >
              נסה שוב
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && shifts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl animate-bounce">🕐</span>
            <p className="text-base font-bold text-slate-300">אין משמרות עדיין</p>
            <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
              לחץ על "כניסה" בדף הראשי כדי להתחיל לעקוב אחר שעות העבודה שלך.
            </p>
          </div>
        )}

        {/* Shift List — grouped by date */}
        {!isLoading && !error && shifts.length > 0 && (
          <div className="space-y-6">
            {groupByDate(shifts).map(([dateKey, dateShifts]) => (
              <section key={dateKey} className="space-y-3">
                {/* Day separator header with Daily Total */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                  <h2 className="text-[11px] font-bold text-slate-400">
                    {formatGroupHeader(dateKey)}
                  </h2>
                  <span className="rounded-full bg-slate-850 border border-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
                    {calculateDailyTotalLabel(dateShifts)}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {dateShifts.map(shift => (
                    <ShiftCard 
                      key={shift.id} 
                      shift={shift} 
                      onEdit={openEditModal} 
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[280px] max-w-[90%]">
        <div className="flex items-center justify-around px-4 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-lg border border-slate-800/80 shadow-2xl">
          <Link
            href="/"
            onClick={triggerHaptic}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">דשבורד</span>
          </Link>
          
          <div className="flex flex-col items-center justify-center text-emerald-400 cursor-default">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5">היסטוריה</span>
          </div>
        </div>
      </nav>

      {/* Edit Shift Modal */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800/80 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-200">עריכת משמרת</h3>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-200 text-lg font-medium"
                aria-label="סגור"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  שעת כניסה
                </label>
                <input
                  type="datetime-local"
                  required
                  value={clockInInput}
                  onChange={(e) => setClockInInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  שעת יציאה
                </label>
                <input
                  type="datetime-local"
                  value={clockOutInput}
                  onChange={(e) => setClockOutInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {modalError && (
                <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {modalError}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isSaving || isDeleting}
                  className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none disabled:opacity-50"
                >
                  {isSaving ? 'שומר...' : 'שמור שינויים'}
                </button>
                
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting}
                  className="rounded-xl border border-rose-950 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-400 transition-colors hover:bg-rose-500/20 active:bg-rose-500/30 disabled:opacity-50"
                >
                  {isDeleting ? 'מוחק...' : 'מחק'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

