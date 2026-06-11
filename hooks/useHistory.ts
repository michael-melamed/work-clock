import { useState, useEffect, useCallback } from 'react'
import type { ApiResponse } from '@/types/api'
import type { CompletedShift } from './useShift'

export function useHistory(limit: number = 30) {
  const [shifts, setShifts] = useState<CompletedShift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/shifts/history?limit=${limit}`)
      const json: ApiResponse<CompletedShift[]> = await res.json()

      if (json.error) throw new Error(json.error)

      setShifts(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  // Automatically fetch history on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  const updateShift = useCallback(async (id: string, clockIn: string, clockOut: string) => {
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clock_in: clockIn, clock_out: clockOut }),
      })
      const json: ApiResponse<CompletedShift> = await res.json()
      if (json.error) throw new Error(json.error)

      if (json.data) {
        setShifts((prev) =>
          prev.map((s) => (s.id === id ? json.data! : s))
        )
      }
      return { success: true, error: null }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [])

  const deleteShift = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/shifts/${id}`, {
        method: 'DELETE',
      })
      const json: ApiResponse<boolean> = await res.json()
      if (json.error) throw new Error(json.error)

      setShifts((prev) => prev.filter((s) => s.id !== id))
      return { success: true, error: null }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [])

  return {
    shifts,
    isLoading,
    error,
    refresh,
    updateShift,
    deleteShift,
  }
}
