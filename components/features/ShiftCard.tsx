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

function formatDate(isoString: string): { dayName: string; date: string } {
  const d = new Date(isoString)
  const dayName = d.toLocaleDateString('he-IL', { weekday: 'long' })
  const date = d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return { dayName, date }
}

export function ShiftCard({ shift, onEdit }: ShiftCardProps) {
  const { dayName, date } = formatDate(shift.clock_in)
  const clockIn = formatTime(shift.clock_in)
  const clockOut = shift.clock_out ? formatTime(shift.clock_out) : '—'

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800 sm:p-5">
      {/* Date header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {dayName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{date}</span>
        </div>
        {onEdit && (
          <button
            onClick={() => onEdit(shift)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="ערוך משמרת"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.062a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
        )}
      </div>

      {/* Times row */}
      <div className="mb-3 flex items-center gap-3 font-mono text-sm text-gray-700 dark:text-gray-300">
        <span className="flex items-center gap-1">
          <span className="text-emerald-500">▶</span>
          {clockIn}
        </span>
        <span className="flex-1 border-t border-dashed border-gray-300 dark:border-gray-600" />
        <span className="flex items-center gap-1">
          <span className="text-red-500">■</span>
          {clockOut}
        </span>
      </div>

      {/* Duration */}
      <div className="text-right">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {shift.duration_formatted || `${shift.duration_minutes} דקות`}
        </span>
      </div>
    </div>
  )
}
