import { useCallback, useEffect, useRef, useState } from 'react'

export interface CountdownOptions {
  initialSeconds: number
  autoStart?: boolean
  /** Fired exactly once when the clock reaches zero. */
  onExpire?: () => void
  /** Called on every whole-second change; useful for persisting timer state. */
  onTick?: (secondsRemaining: number) => void
}

export interface CountdownController {
  secondsRemaining: number
  running: boolean
  expired: boolean
  start: () => void
  pause: () => void
  reset: (seconds?: number) => void
  /** Immediately drives the clock to zero without firing `onExpire`. */
  stop: () => void
}

/**
 * Deadline-based countdown. Timestamps rather than tick counting keep the clock
 * accurate when the tab is throttled in the background.
 */
export function useCountdown({
  initialSeconds,
  autoStart = false,
  onExpire,
  onTick,
}: CountdownOptions): CountdownController {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds)
  const [running, setRunning] = useState(autoStart)
  const [expired, setExpired] = useState(false)

  const deadlineRef = useRef(0)
  const remainingRef = useRef(initialSeconds)
  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)
  const onTickRef = useRef(onTick)

  onExpireRef.current = onExpire
  onTickRef.current = onTick

  useEffect(() => {
    if (!running) return
    deadlineRef.current = Date.now() + remainingRef.current * 1000

    const tick = () => {
      const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      if (next !== remainingRef.current) {
        remainingRef.current = next
        setSecondsRemaining(next)
        onTickRef.current?.(next)
      }
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true
        setExpired(true)
        setRunning(false)
        onExpireRef.current?.()
      }
    }

    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [running])

  const start = useCallback(() => {
    if (remainingRef.current <= 0) return
    setRunning(true)
  }, [])

  const pause = useCallback(() => setRunning(false), [])

  const reset = useCallback((seconds?: number) => {
    const value = seconds ?? initialSeconds
    remainingRef.current = value
    deadlineRef.current = Date.now() + value * 1000
    expiredRef.current = false
    setExpired(false)
    setSecondsRemaining(value)
  }, [initialSeconds])

  const stop = useCallback(() => {
    remainingRef.current = 0
    setSecondsRemaining(0)
    setRunning(false)
  }, [])

  return { secondsRemaining, running, expired, start, pause, reset, stop }
}
