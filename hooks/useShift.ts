import { useState, useEffect, useCallback } from 'react'
import type { ApiResponse } from '@/types/api'

// Temporary interface until we generate Supabase types
export interface Shift {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

export interface CompletedShift extends Shift {
  duration_formatted: string
}

export interface ShiftState {
  isActive: boolean
  currentShift: Shift | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  lastCompletedShift: CompletedShift | null
}

export function useShift() {
  const [state, setState] = useState<ShiftState>({
    isActive: false,
    currentShift: null,
    isLoading: true,
    isSubmitting: false,
    error: null,
    lastCompletedShift: null,
  })

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const res = await fetch('/api/shifts/status')
      const json: ApiResponse<{ active: boolean; shift: Shift | null }> = await res.json()

      if (json.error) throw new Error(json.error)

      setState(prev => ({
        ...prev,
        isActive: json.data?.active || false,
        currentShift: json.data?.shift || null,
        isLoading: false,
      }))
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }))
    }
  }, [])

  const clockIn = async () => {
    try {
      setState(prev => ({ ...prev, isSubmitting: true, error: null }))
      const res = await fetch('/api/shifts/clock-in', { method: 'POST' })
      const json: ApiResponse<Shift> = await res.json()

      if (json.error) throw new Error(json.error)

      setState(prev => ({
        ...prev,
        isActive: true,
        currentShift: json.data,
        isSubmitting: false,
      }))
    } catch (err: any) {
      setState(prev => ({ ...prev, isSubmitting: false, error: err.message }))
    }
  }

  const clockOut = async () => {
    try {
      setState(prev => ({ ...prev, isSubmitting: true, error: null }))
      const res = await fetch('/api/shifts/clock-out', { method: 'POST' })
      const json: ApiResponse<CompletedShift> = await res.json()

      if (json.error) throw new Error(json.error)

      setState(prev => ({
        ...prev,
        isActive: false,
        currentShift: null,
        lastCompletedShift: json.data,
        isSubmitting: false,
      }))
    } catch (err: any) {
      setState(prev => ({ ...prev, isSubmitting: false, error: err.message }))
    }
  }

  // Automatically load status on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    ...state,
    clockIn,
    clockOut,
    refresh,
  }
}
