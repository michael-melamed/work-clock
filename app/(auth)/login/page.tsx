'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createSupabaseBrowserClient()

  const handleLogin = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    
    if (error) {
      console.error('Error logging in:', error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] px-4 py-12 sm:px-6 lg:px-8 select-none" dir="rtl">
      <div className="w-full max-w-sm space-y-8 rounded-2xl glass-panel p-8 shadow-2xl border border-slate-800/80 text-center">
        <div>
          {/* Logo Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-pulse-glow">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            WorkClock
          </h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[240px] mx-auto">
            התחבר כדי להתחיל לעקוב אחר שעות העבודה שלך בצורה פשוטה ואמינה.
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative flex w-full justify-center items-center gap-3 rounded-xl bg-white hover:bg-slate-100 px-4 py-3 text-xs font-bold text-slate-900 transition-all active:scale-95 disabled:opacity-75"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
            ) : (
              <svg className="h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
            )}
            <span>{isLoading ? 'מתחבר ל-Google...' : 'התחברות באמצעות Google'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
