import { useState, useEffect, useCallback } from 'react'
import type {
  AutomationSettings,
  AutomationSettingsUpdate,
  WorkLocation,
} from '@/types/automation'
import type { ApiResponse } from '@/types/api'

interface AutomationState {
  settings: AutomationSettings | null
  locations: WorkLocation[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

/**
 * useAutomation
 * Manages all automation settings and work locations for the current user.
 * Provides updateSettings, addLocation, deleteLocation, and push subscription helpers.
 */
export function useAutomation() {
  const [state, setState] = useState<AutomationState>({
    settings: null,
    locations: [],
    isLoading: true,
    isSaving: false,
    error: null,
  })

  /** Load settings and locations in parallel */
  const load = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const [settingsRes, locationsRes] = await Promise.all([
        fetch('/api/automation/settings'),
        fetch('/api/automation/locations'),
      ])

      const settingsJson: ApiResponse<AutomationSettings> = await settingsRes.json()
      const locationsJson: ApiResponse<WorkLocation[]> = await locationsRes.json()

      if (settingsJson.error) throw new Error(settingsJson.error)
      if (locationsJson.error) throw new Error(locationsJson.error)

      setState(prev => ({
        ...prev,
        settings: settingsJson.data,
        locations: locationsJson.data ?? [],
        isLoading: false,
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בטעינת הגדרות'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
    }
  }, [])

  /** Save (PUT) automation settings changes */
  const updateSettings = useCallback(async (update: AutomationSettingsUpdate) => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }))

      const res = await fetch('/api/automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      const json: ApiResponse<AutomationSettings> = await res.json()
      if (json.error) throw new Error(json.error)

      setState(prev => ({ ...prev, settings: json.data, isSaving: false }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בשמירת הגדרות'
      setState(prev => ({ ...prev, isSaving: false, error: message }))
    }
  }, [])

  /** Add a new work location */
  const addLocation = useCallback(
    async (location: Pick<WorkLocation, 'name' | 'latitude' | 'longitude' | 'radius_meters'>) => {
      try {
        setState(prev => ({ ...prev, isSaving: true, error: null }))

        const res = await fetch('/api/automation/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(location),
        })
        const json: ApiResponse<WorkLocation> = await res.json()
        if (json.error) throw new Error(json.error)

        setState(prev => ({
          ...prev,
          locations: [...prev.locations, json.data!],
          isSaving: false,
        }))
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'שגיאה בהוספת מיקום'
        setState(prev => ({ ...prev, isSaving: false, error: message }))
      }
    },
    []
  )

  /** Delete a work location by id */
  const deleteLocation = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }))

      const res = await fetch(`/api/automation/locations/${id}`, { method: 'DELETE' })
      const json: ApiResponse<null> = await res.json()
      if (json.error) throw new Error(json.error)

      setState(prev => ({
        ...prev,
        locations: prev.locations.filter(l => l.id !== id),
        // Clear active_location_id if it was this one
        settings:
          prev.settings?.active_location_id === id
            ? { ...prev.settings!, active_location_id: null }
            : prev.settings,
        isSaving: false,
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה במחיקת מיקום'
      setState(prev => ({ ...prev, isSaving: false, error: message }))
    }
  }, [])

  /**
   * Subscribe to Web Push notifications.
   * Stores the PushSubscription in automation_settings.push_subscription.
   * Requires the browser to support Push API and the user to grant permission.
  /**
   * Subscribe to Web Push notifications.
   * Stores the PushSubscription in automation_settings.push_subscription.
   * Requires the browser to support Push API and the user to grant permission.
   */
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      const msg = 'Push API אינו נתמך בדפדפן זה'
      console.warn('[useAutomation]', msg)
      setState(prev => ({ ...prev, error: msg }))
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        const msg = 'הרשאת התראות נדחתה. יש לאשר התראות בהגדרות הדפדפן/האפליקציה'
        console.warn('[useAutomation]', msg)
        setState(prev => ({ ...prev, error: msg }))
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')

      // Convert VAPID Base64 key to Uint8Array standardly
      const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4)
      const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/')
      const rawData = window.atob(base64)
      const rawBytes = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        rawBytes[i] = rawData.charCodeAt(i)
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: rawBytes,
      })

      // Save subscription to server
      await updateSettings({ push_subscription: subscription.toJSON() })
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה בהרשמה לעדכונים'
      console.error('[useAutomation] Push subscribe error:', err)
      setState(prev => ({ ...prev, error: message }))
      return false
    }
  }, [updateSettings])

  // Load on mount
  useEffect(() => {
    load()
  }, [load])

  return {
    ...state,
    load,
    updateSettings,
    addLocation,
    deleteLocation,
    subscribeToPush,
  }
}
