import { useEffect, useRef } from 'react'

export interface FocusMonitorHandlers {
  onTabSwitch: () => void
  onWindowBlur: () => void
}

/**
 * Watches for the candidate leaving the exam window.
 *
 * `visibilitychange` fires for tab switches and minimising; `blur` fires when
 * focus moves to another application or a devtools panel. They are reported
 * separately so the final report can distinguish the two.
 */
export function useFocusMonitor(enabled: boolean, handlers: FocusMonitorHandlers): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled) return

    let blurTimer: number | undefined

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handlersRef.current.onTabSwitch()
    }

    const handleBlur = () => {
      // A tab switch also raises `blur`; the short delay lets the visibility
      // handler claim the event first so it is not counted twice.
      blurTimer = window.setTimeout(() => {
        if (document.visibilityState === 'visible') handlersRef.current.onWindowBlur()
      }, 180)
    }

    const handleFocus = () => {
      if (blurTimer) window.clearTimeout(blurTimer)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      if (blurTimer) window.clearTimeout(blurTimer)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled])
}
