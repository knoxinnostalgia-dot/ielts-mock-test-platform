import { useCallback, useEffect, useRef, useState } from 'react'

export type RecorderStatus = 'idle' | 'requesting' | 'ready' | 'recording' | 'error'

export interface RecorderResult {
  blob: Blob
  durationSeconds: number
  mimeType: string
}

export interface RecorderController {
  status: RecorderStatus
  supported: boolean
  elapsed: number
  error: string | null
  /** Requests microphone access up front so the first task is not delayed. */
  prepare: () => Promise<boolean>
  start: () => Promise<boolean>
  stop: () => void
  release: () => void
}

function preferredMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

/**
 * Microphone-only recorder for the speaking module.
 *
 * The camera stream used by proctoring is deliberately kept separate: this hook
 * never requests video, and the proctoring monitor never requests audio.
 */
export function useAudioRecorder(onComplete: (result: RecorderResult) => void): RecorderController {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | undefined>(undefined)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'

  const release = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = undefined
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStatus('idle')
  }, [])

  useEffect(() => release, [release])

  const prepare = useCallback(async () => {
    if (!supported) {
      setError('Audio recording is not supported in this browser.')
      setStatus('error')
      return false
    }
    if (streamRef.current) {
      setStatus('ready')
      return true
    }
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      setStatus('ready')
      setError(null)
      return true
    } catch (mediaError) {
      console.warn('[recorder] microphone denied', mediaError)
      setError('Microphone access was denied. Enable it in your browser settings to record answers.')
      setStatus('error')
      return false
    }
  }, [supported])

  const start = useCallback(async () => {
    const ready = await prepare()
    if (!ready || !streamRef.current) return false

    chunksRef.current = []
    const mimeType = preferredMimeType()
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    } catch (recorderError) {
      console.warn('[recorder] could not start', recorderError)
      setError('Recording could not be started on this device.')
      setStatus('error')
      return false
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type })
      const durationSeconds = (Date.now() - startedAtRef.current) / 1000
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = undefined
      setStatus('ready')
      if (blob.size > 0) {
        onCompleteRef.current({ blob, durationSeconds, mimeType: type })
      }
    }

    recorderRef.current = recorder
    startedAtRef.current = Date.now()
    setElapsed(0)
    recorder.start(250)
    setStatus('recording')

    timerRef.current = window.setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000)
    }, 100)

    return true
  }, [prepare])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }, [])

  return { status, supported, elapsed, error, prepare, start, stop, release }
}
