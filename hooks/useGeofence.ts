import { useEffect, useRef, useCallback } from 'react'
import type { WorkLocation } from '@/types/automation'

/** Calculates distance in meters between two GPS coordinates (Haversine formula) */
function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface UseGeofenceOptions {
  location: WorkLocation | null
  enabled: boolean
  onEnter: () => void
  onExit: () => void
  /** How often to poll position in ms (default: 30000 = 30 seconds) */
  intervalMs?: number
}

/**
 * useGeofence
 *
 * Foreground-only geofence watcher.
 * While the app is open, polls the user's GPS position every `intervalMs`
 * and fires onEnter/onExit when crossing the location's radius boundary.
 *
 * Limitations (PWA):
 *  - Only works while the app is open / in foreground
 *  - iOS Safari does not support background geolocation for PWAs
 *  - Requires Geolocation permission from the user
 */
export function useGeofence({
  location,
  enabled,
  onEnter,
  onExit,
  intervalMs = 30_000,
}: UseGeofenceOptions): void {
  const isInsideRef = useRef<boolean | null>(null) // null = unknown (first check)
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stable callbacks so we don't re-subscribe on every render
  const onEnterStable = useRef(onEnter)
  const onExitStable = useRef(onExit)
  useEffect(() => { onEnterStable.current = onEnter }, [onEnter])
  useEffect(() => { onExitStable.current = onExit }, [onExit])

  const checkPosition = useCallback(
    (pos: GeolocationPosition) => {
      if (!location) return

      const distance = getDistanceMeters(
        pos.coords.latitude,
        pos.coords.longitude,
        location.latitude,
        location.longitude
      )

      const inside = distance <= location.radius_meters

      // Fire events only on state transitions
      if (isInsideRef.current === null) {
        // First reading — just set state, don't fire event
        isInsideRef.current = inside
        return
      }

      if (inside && !isInsideRef.current) {
        isInsideRef.current = true
        onEnterStable.current()
      } else if (!inside && isInsideRef.current) {
        isInsideRef.current = false
        onExitStable.current()
      }
    },
    [location]
  )

  useEffect(() => {
    if (!enabled || !location || typeof navigator === 'undefined' || !navigator.geolocation) {
      return
    }

    // Initial position check
    navigator.geolocation.getCurrentPosition(checkPosition, (err) => {
      console.warn('[useGeofence] Could not get initial position:', err.message)
    })

    // Poll periodically
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(checkPosition, (err) => {
        console.warn('[useGeofence] Position poll failed:', err.message)
      })
    }, intervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      isInsideRef.current = null // Reset state on cleanup
    }
  }, [enabled, location, checkPosition, intervalMs])
}
