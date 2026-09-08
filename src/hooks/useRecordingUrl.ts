import { useEffect, useState } from 'react'

import { loadRecording } from '@/utils/storage'

/** Resolves a stored recording id into a playable object URL. */
export function useRecordingUrl(recordingId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    if (!recordingId) {
      setUrl(null)
      return
    }

    void loadRecording(recordingId).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [recordingId])

  return url
}
