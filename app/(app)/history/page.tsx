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
  if (hours > 0) {
    return `${hours} שעות ו-${minutes} דק׳`
  }
  return `${minutes} דק׳`
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link
            href="/"
            className="flex items-center justify-center rounded-xl p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="חזרה לדשבורד"
          >
            {/* Arrow pointing right for RTL back navigation */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">היסטוריית משמרות</h1>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-6">

        {/* Monthly Summary Widget */}
        {!isLoading && !error && shifts.length > 0 && (
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-lg dark:from-slate-855 dark:to-slate-955 animate-in fade-in slide-in-from-top-3 duration-300">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">סיכום 30 המשמרות האחרונות</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {monthlySummary.hours}
              </span>
              <span className="text-sm font-medium text-slate-300">שעות</span>
              <span className="text-3xl font-extrabold tracking-tight mr-3">
                {monthlySummary.minutes}
              </span>
              <span className="text-sm font-medium text-slate-300">דקות</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
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
            <p className="text-gray-500 dark:text-gray-400">אירעה שגיאה בטעינת ההיסטוריה</p>
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={refresh}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              נסה שוב
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && shifts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">🕐</span>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">אין משמרות עדיין</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              לחץ על "כניסה" בדף הראשי כדי להתחיל לעקוב אחר שעות העבודה שלך
            </p>
          </div>
        )}

        {/* Shift List — grouped by date */}
        {!isLoading && !error && shifts.length > 0 && (
          <div className="space-y-6">
            {groupByDate(shifts).map(([dateKey, dateShifts]) => (
              <section key={dateKey} className="space-y-3">
                {/* Day separator header with Daily Total */}
                <div className="flex items-center justify-between border-b border-gray-150/70 pb-1.5 dark:border-gray-800">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {formatGroupHeader(dateKey)}
                  </h2>
                  <span className="rounded-full bg-gray-200/60 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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

      {/* Edit Shift Modal */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">עריכת משמרת</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-light"
                aria-label="סגור"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  שעת כניסה
                </label>
                <input
                  type="datetime-local"
                  required
                  value={clockInInput}
                  onChange={(e) => setClockInInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  שעת יציאה
                </label>
                <input
                  type="datetime-local"
                  value={clockOutInput}
                  onChange={(e) => setClockOutInput(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {modalError && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg">
                  {modalError}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={isSaving || isDeleting}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSaving ? 'שומר...' : 'שמור שינויים'}
                </button>
                
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 active:bg-red-200 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
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
