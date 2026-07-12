'use client'

import { useState, useEffect, useRef } from 'react'
import { useShift } from '@/hooks/useShift'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const { isActive, currentShift, isLoading, isSubmitting, error, lastCompletedShift, clockIn, clockOut } = useShift()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [showSummary, setShowSummary] = useState(false)
  const summaryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createSupabaseBrowserClient()

  // Digital clock update
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch user info on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
      }
    })
  }, [supabase])

  // Elapsed time calculation for active shift
  useEffect(() => {
    if (!isActive || !currentShift) {
      setElapsedTime('')
      return
    }

    const clockInDate = new Date(currentShift.clock_in)
    
    const updateElapsed = () => {
      const now = new Date()
      const diffMs = now.getTime() - clockInDate.getTime()
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60)
      const seconds = Math.floor((diffMs / 1000) % 60)
      
      const pad = (n: number) => n.toString().padStart(2, '0')
      
      if (hours > 0) {
        setElapsedTime(`${hours}:${pad(minutes)}:${pad(seconds)}`)
      } else {
        setElapsedTime(`${pad(minutes)}:${pad(seconds)}`)
      }
    }

    updateElapsed() // Initial call
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [isActive, currentShift])

  // Update document title dynamically based on active shift
  useEffect(() => {
    if (isActive && elapsedTime) {
      document.title = `⏱️ ${elapsedTime} - WorkClock`
    } else {
      document.title = 'WorkClock'
    }
    return () => {
      document.title = 'WorkClock'
    }
  }, [isActive, elapsedTime])

  // Show Bottom Sheet summary when shift is completed
  useEffect(() => {
    if (lastCompletedShift) {
      setShowSummary(true)
      
      // Auto-hide after 8 seconds
      if (summaryTimeoutRef.current) clearTimeout(summaryTimeoutRef.current)
      summaryTimeoutRef.current = setTimeout(() => {
        setShowSummary(false)
      }, 8000)
    }

    return () => {
      if (summaryTimeoutRef.current) clearTimeout(summaryTimeoutRef.current)
    }
  }, [lastCompletedShift])

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60)
    }
  }

  const handleSignOut = async () => {
    triggerHaptic()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleClockIn = async () => {
    triggerHaptic()
    await clockIn()
  }

  const handleClockOut = async () => {
    triggerHaptic()
    await clockOut()
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] text-slate-100" dir="rtl">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <span className="text-sm font-medium text-slate-400">טוען נתונים...</span>
        </div>
      </div>
    )
  }

  // Formatting hours and minutes for display
  const hoursString = currentTime ? currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  const secondsString = currentTime ? currentTime.toLocaleTimeString('he-IL', { second: '2-digit' }) : '00'
  const clockedInTime = currentShift ? new Date(currentShift.clock_in).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div className="flex min-h-screen flex-col bg-[#090d16] text-slate-100 relative overflow-hidden font-sans select-none" dir="rtl">
      
      {/* Background Ambient Glow */}
      {isActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[110px] pointer-events-none animate-ambient-glow z-0" />
      )}

      {/* Top Header */}
      <header className="z-10 w-full px-6 pt-4">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-2xl glass-panel px-4 py-3 shadow-lg">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-200">
                שלום, {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
            </div>
          ) : (
            <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
          )}
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors border border-slate-700/30"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>יציאה</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-between px-4 pb-28 pt-8">
        
        {/* Error Alert */}
        {error && (
          <div className="w-full rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-center text-xs font-medium text-rose-300 animate-shake">
            {error}
          </div>
        )}

        {/* Digital Clock Display */}
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="flex items-baseline font-mono text-7xl font-extralight tracking-widest text-slate-100 drop-shadow-[0_0_20px_rgba(248,250,252,0.08)]" dir="ltr">
            <span>{hoursString}</span>
            <span className="text-4xl text-slate-400 font-light mx-1 animate-pulse">:</span>
            <span className="text-4xl text-slate-400 font-light">{secondsString}</span>
          </div>
        </div>

        {/* Dual-Button Implementation (Tamar's Request with Glowing Glass design) */}
        <div className="w-full max-w-xs my-auto flex flex-col gap-4">
          <button
            onClick={handleClockIn}
            disabled={isActive || isSubmitting}
            className={`
              w-full py-4 px-6 rounded-2xl text-center text-lg font-semibold transition-all active:scale-98
              ${isActive 
                ? 'bg-slate-900/50 text-slate-600 border border-slate-800/40 opacity-30 grayscale pointer-events-none' 
                : 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/40 shadow-[0_0_30px_-5px_rgba(16,185,129,0.12)]'}
              disabled:cursor-not-allowed
            `}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isSubmitting && !isActive ? (
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
            ) : (
              <span>כניסה למשמרת</span>
            )}
          </button>

          <button
            onClick={handleClockOut}
            disabled={!isActive || isSubmitting}
            className={`
              w-full py-4 px-6 rounded-2xl text-center text-lg font-semibold transition-all active:scale-98
              ${!isActive 
                ? 'bg-slate-900/50 text-slate-600 border border-slate-800/40 opacity-30 grayscale pointer-events-none' 
                : 'bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:border-rose-500/40 shadow-[0_0_30px_-5px_rgba(244,63,94,0.12)]'}
              disabled:cursor-not-allowed
            `}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isSubmitting && isActive ? (
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-rose-400 border-t-transparent"></div>
            ) : (
              <span>יציאה מהמשמרת</span>
            )}
          </button>
        </div>

        {/* State Status Display */}
        <div className="w-full max-w-xs text-center my-auto min-h-[6.5rem] flex items-center justify-center">
          {isActive ? (
            <div className="w-full rounded-2xl glass-card p-4 border border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-slate-400">משמרת פעילה</span>
              </div>
              <p className="text-xs text-slate-300">
                נכנסת בשעה <span className="font-semibold text-white">{clockedInTime}</span>
              </p>
              <div className="font-mono text-3xl font-extrabold text-emerald-400 mt-2 tracking-wider">
                {elapsedTime}
              </div>
            </div>
          ) : lastCompletedShift ? (
            <div className="w-full rounded-2xl glass-card p-4 border border-slate-700/30 animate-in fade-in slide-in-from-bottom-2 duration-300" dir="rtl">
              <p className="text-xs font-semibold text-slate-400 mb-1">סיכום משמרת אחרונה</p>
              <p className="text-sm font-bold text-white">
                עבדת {formatDurationHebrew(lastCompletedShift.duration_minutes)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">לחץ על כניסה להתחלת משמרת חדשה</p>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-300">מוכן לעבודה</p>
              <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                לחץ על לחצן הכניסה כדי להתחיל למדוד את שעות העבודה שלך.
              </p>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[320px] max-w-[92%]">
        <div className="flex items-center justify-around px-4 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-lg border border-slate-800/80 shadow-2xl">
          <div className="flex flex-col items-center justify-center text-emerald-400 cursor-default">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-[10px] font-bold mt-0.5">דשבורד</span>
          </div>
          
          <Link
            href="/history"
            onClick={triggerHaptic}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">היסטוריה</span>
          </Link>

          <Link
            href="/settings"
            onClick={triggerHaptic}
            className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756-2.924 0-3.35a1.724 1.724 0 00-1.066-2.573c.94-1.543-.826-3.31-2.37-2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium mt-0.5">הגדרות</span>
          </Link>
        </div>
      </nav>

      {/* Slide-up Bottom Sheet (Summary) */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 transition-transform duration-500 ease-out transform ${
          showSummary ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full max-w-md rounded-t-3xl bg-slate-900 border-t border-slate-800 p-6 shadow-[0_-15px_30px_rgba(0,0,0,0.5)]" dir="rtl">
          {/* Handlebar */}
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-700" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-white">המשמרת נשמרה בהצלחה!</h4>
            </div>
            <button 
              onClick={() => { triggerHaptic(); setShowSummary(false); }}
              className="text-slate-400 hover:text-slate-200 p-1 text-sm font-medium"
            >
              סגור
            </button>
          </div>

          {lastCompletedShift && (
            <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2 mb-5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>זמן כניסה:</span>
                <span className="font-mono text-slate-200">
                  {new Date(lastCompletedShift.clock_in).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>זמן יציאה:</span>
                <span className="font-mono text-slate-200">
                  {lastCompletedShift.clock_out ? new Date(lastCompletedShift.clock_out).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <hr className="border-slate-800" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-bold text-slate-300">סה״כ שעות עבודה:</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatDurationHebrew(lastCompletedShift.duration_minutes)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { triggerHaptic(); setShowSummary(false); }}
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-sm font-bold text-slate-200 transition-colors border border-slate-700/50"
            >
              המשך
            </button>
            <Link
              href="/history"
              onClick={() => { triggerHaptic(); setShowSummary(false); }}
              className="flex-1 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-bold text-white transition-colors"
            >
              צפה ועדכן בהיסטוריה
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  )
}
