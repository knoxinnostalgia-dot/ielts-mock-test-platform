import { useCallback, useEffect, useState } from 'react'

export interface FullscreenController {
  isFullscreen: boolean
  supported: boolean
  request: () => Promise<boolean>
  exit: () => Promise<void>
}

export function useFullscreen(onExit?: () => void): FullscreenController {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && !!document.fullscreenElement,
  )
  const supported =
    typeof document !== 'undefined' && (document.fullscreenEnabled ?? false)

  useEffect(() => {
    const handler = () => {
      const active = !!document.fullscreenElement
      setIsFullscreen((previous) => {
        if (previous && !active) onExit?.()
        return active
      })
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [onExit])

  const request = useCallback(async () => {
    if (!document.documentElement.requestFullscreen) return false
    try {
      await document.documentElement.requestFullscreen()
      return true
    } catch (error) {
      console.warn('[fullscreen] request rejected', error)
      return false
    }
  }, [])

  const exit = useCallback(async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen()
      } catch (error) {
        console.warn('[fullscreen] exit failed', error)
      }
    }
  }, [])

  return { isFullscreen, supported, request, exit }
}
