'use client'

import { useState, useEffect } from 'react'
import { useShift } from '@/hooks/useShift'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardPage() {
  const { isActive, currentShift, isLoading, isSubmitting, error, lastCompletedShift, clockIn, clockOut } = useShift()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>('')
  const [user, setUser] = useState<any>(null)
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900" dir="rtl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  // Formatting values for display
  const timeString = currentTime ? currentTime.toLocaleTimeString('he-IL', { hour12: false }) : '--:--:--'
  const clockedInTime = currentShift ? new Date(currentShift.clock_in).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Top Header */}
      <header className="border-b border-gray-200/50 bg-white/50 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-900/50">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          {user ? (
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              שלום, {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
          ) : (
            <div className="h-4 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          )}
          
          <button
            onClick={handleSignOut}
            className="rounded-xl bg-gray-150 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            יציאה מהחשבון
          </button>
        </div>
      </header>

      {/* Main Dashboard Panel */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 w-full max-w-sm rounded-lg bg-red-100 p-4 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Large Digital Clock */}
        <div className="mb-12 font-mono text-7xl font-light tracking-tight text-gray-900 dark:text-white sm:text-8xl md:text-9xl">
          {timeString}
        </div>

        {/* Main Clock In/Out Button */}
        <button
          onClick={isActive ? clockOut : clockIn}
          disabled={isSubmitting}
          className={`
            group relative mb-8 flex h-48 w-48 flex-col items-center justify-center rounded-full text-2xl font-bold shadow-2xl transition-all duration-300 active:scale-95 sm:h-56 sm:w-56 sm:text-3xl
            ${isActive 
              ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500'}
            disabled:cursor-not-allowed disabled:opacity-75
            focus:outline-none focus:ring-4 focus:ring-offset-4 dark:focus:ring-offset-gray-900
          `}
        >
          {isSubmitting ? (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          ) : (
            <span>{isActive ? 'יציאה' : 'כניסה'}</span>
          )}
        </button>

        {/* Status Display */}
        <div className="mb-auto min-h-[6rem] text-center">
          {isActive ? (
            <div className="flex animate-pulse flex-col items-center space-y-2">
              <span className="text-lg font-medium text-gray-600 dark:text-gray-300 sm:text-xl">
                נכנסת בשעה {clockedInTime}
              </span>
              <span className="font-mono text-2xl font-semibold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                {elapsedTime}
              </span>
            </div>
          ) : lastCompletedShift ? (
            <div className="rounded-2xl bg-white px-6 py-4 shadow-sm dark:bg-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">סיכום משמרת אחרונה</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                עבדת {lastCompletedShift.duration_formatted}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">לחץ על הכפתור כדי להתחיל משמרת</p>
          )}
        </div>

        {/* History Link */}
        <div className="mt-8">
          <Link 
            href="/history" 
            className="text-base font-medium text-blue-600 transition-colors hover:text-blue-500 hover:underline dark:text-blue-400"
          >
            צפייה בהיסטוריית משמרות &larr;
          </Link>
        </div>
      </main>
    </div>
  )
}
