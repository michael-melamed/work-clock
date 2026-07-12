import type { CompletedShift } from '@/hooks/useShift'

interface ShiftCardProps {
  shift: CompletedShift
  onEdit?: (shift: CompletedShift) => void
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDurationHebrew(durationMinutes: number | null | undefined): string {
  if (durationMinutes === null || durationMinutes === undefined) return ''
  const hours = Math.floor(durationMinutes / 60)
  const minsCalculated = durationMinutes % 60
  
  if (hours === 0) {
    if (minsCalculated === 1) return 'דקה אחת'
    return `${minsCalculated} דקות`
  }
  
  if (minsCalculated === 0) {
    if (hours === 1) return 'שעה אחת'
    return `${hours} שעות`
  }
  
  const hoursPart = hours === 1 ? 'שעה אחת' : `${hours} שעות`
  const minsPart = minsCalculated === 1 ? 'דקה אחת' : `${minsCalculated} דקות`
  return `${hoursPart} ו-${minsPart}`
}

export function ShiftCard({ shift, onEdit }: ShiftCardProps) {
  const clockIn = formatTime(shift.clock_in)
  const clockOut = shift.clock_out ? formatTime(shift.clock_out) : '—'

  return (
    <div className="rounded-2xl glass-card p-4 shadow-lg border border-slate-800/40 flex items-center justify-between gap-4">
      {/* Right side: times and duration */}
      <div className="flex flex-row items-center gap-3 text-right">
        {/* Shift times timeline */}
        <div className="flex items-center gap-2 font-mono text-sm text-slate-200" dir="ltr">
          <span>{clockIn}</span>
          <span className="text-slate-500 text-xs">➔</span>
          <span>{clockOut}</span>
        </div>
        
        {/* Duration Badge */}
        <div>
          <span className="inline-block rounded-full bg-slate-850 border border-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
            {formatDurationHebrew(shift.duration_minutes)}
          </span>
        </div>
      </div>

      {/* Left side: edit button */}
      {onEdit && (
        <button
          onClick={() => onEdit(shift)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="ערוך משמרת"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.062a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        </button>
      )}
    </div>
  )
}
