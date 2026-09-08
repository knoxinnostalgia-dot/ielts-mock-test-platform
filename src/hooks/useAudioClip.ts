import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { resolveClipSource } from '@/utils/audioManifest'
import { MAX_AUDIO_PLAYS } from '@/utils/constants'

export type ClipStatus = 'loading' | 'idle' | 'playing' | 'paused' | 'ended' | 'error'
export type ClipMode = 'file' | 'speech'

export interface AudioClipOptions {
  clipId: string
  /** Optional MP3 in /public/audio. Falls back to speech synthesis when absent. */
  src?: string
  transcript: string
  estimatedSeconds: number
  playsUsed: number
  maxPlays?: number
  /** Called once per fresh playback so the caller can persist the play count. */
  onPlayStart: (clipId: string) => void
  onPlayEnd?: (clipId: string) => void
}

export interface AudioClipController {
  status: ClipStatus
  mode: ClipMode
  duration: number
  position: number
  progress: number
  playsUsed: number
  playsRemaining: number
  limitReached: boolean
  canStart: boolean
  play: () => void
  pause: () => void
  error: string | null
}

/** Rough spoken duration when no media file is available. */
function estimateSpeechSeconds(transcript: string, fallback: number): number {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length
  return Math.max(fallback, Math.round(words / 2.5))
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null
  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) return null
  return (
    voices.find((voice) => /en-GB/i.test(voice.lang)) ??
    voices.find((voice) => /^en/i.test(voice.lang)) ??
    voices[0]
  )
}

/**
 * Plays a listening clip while enforcing the hard two-play limit.
 *
 * Pausing and resuming never consumes a play; only starting playback from the
 * beginning does. Once the limit is reached the controller reports
 * `limitReached` and refuses to start again for the rest of the session.
 */
export function useAudioClip(options: AudioClipOptions): AudioClipController {
  const {
    clipId,
    src,
    transcript,
    estimatedSeconds,
    playsUsed,
    maxPlays = MAX_AUDIO_PLAYS,
    onPlayStart,
    onPlayEnd,
  } = options

  const [status, setStatus] = useState<ClipStatus>('loading')
  const [mode, setMode] = useState<ClipMode>(src ? 'file' : 'speech')
  const [duration, setDuration] = useState(() => estimateSpeechSeconds(transcript, estimatedSeconds))
  const [position, setPosition] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speechStartRef = useRef(0)
  const speechElapsedRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)
  const keepAliveRef = useRef<number | undefined>(undefined)
  const callbacksRef = useRef({ onPlayStart, onPlayEnd })
  callbacksRef.current = { onPlayStart, onPlayEnd }

  const limitReached = playsUsed >= maxPlays

  /* Resolve the media file if one is published; otherwise synthesise speech. */
  useEffect(() => {
    let cancelled = false
    let audio: HTMLAudioElement | null = null
    setPosition(0)
    setStatus('loading')

    const fallBackToSpeech = () => {
      if (cancelled) return
      audioRef.current = null
      setMode('speech')
      setDuration(estimateSpeechSeconds(transcript, estimatedSeconds))
      setStatus('idle')
    }

    void resolveClipSource(src).then((resolved) => {
      if (cancelled) return
      if (!resolved) {
        fallBackToSpeech()
        return
      }

      audio = new Audio()
      audio.preload = 'metadata'
      audio.src = resolved

      audio.addEventListener('loadedmetadata', () => {
        if (cancelled || !audio) return
        if (Number.isFinite(audio.duration) && audio.duration > 0.5) {
          audioRef.current = audio
          setMode('file')
          setDuration(audio.duration)
          setStatus('idle')
        } else {
          fallBackToSpeech()
        }
      })
      audio.addEventListener('error', fallBackToSpeech)
      audio.load()
    })

    return () => {
      cancelled = true
      audio?.pause()
      audioRef.current = null
    }
  }, [src, transcript, estimatedSeconds])

  const stopLoops = useCallback(() => {
    if (rafRef.current) window.clearInterval(rafRef.current)
    if (keepAliveRef.current) window.clearInterval(keepAliveRef.current)
    rafRef.current = undefined
    keepAliveRef.current = undefined
  }, [])

  useEffect(() => {
    return () => {
      stopLoops()
      audioRef.current?.pause()
      if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    }
  }, [stopLoops])

  const finish = useCallback(() => {
    stopLoops()
    setStatus('ended')
    setPosition((current) => current)
    callbacksRef.current.onPlayEnd?.(clipId)
  }, [clipId, stopLoops])

  const startFilePlayback = useCallback(
    (audio: HTMLAudioElement, fromStart: boolean) => {
      if (fromStart) audio.currentTime = 0
      const onTime = () => setPosition(audio.currentTime)
      const onEnded = () => {
        setPosition(audio.duration)
        finish()
        audio.removeEventListener('timeupdate', onTime)
        audio.removeEventListener('ended', onEnded)
      }
      audio.addEventListener('timeupdate', onTime)
      audio.addEventListener('ended', onEnded)
      void audio
        .play()
        .then(() => setStatus('playing'))
        .catch((playError) => {
          console.warn('[audio] playback rejected', playError)
          setError('Playback was blocked by the browser. Interact with the page and try again.')
          setStatus('idle')
        })
    },
    [finish],
  )

  const startSpeechPlayback = useCallback(
    (fromStart: boolean) => {
      if (typeof speechSynthesis === 'undefined') {
        setError('This browser cannot play the recording.')
        setStatus('error')
        return
      }

      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(transcript)
      const voice = pickVoice()
      if (voice) utterance.voice = voice
      utterance.lang = voice?.lang ?? 'en-GB'
      utterance.rate = 0.95
      utterance.pitch = 1

      const total = estimateSpeechSeconds(transcript, estimatedSeconds)
      setDuration(total)

      if (fromStart) speechElapsedRef.current = 0
      speechStartRef.current = Date.now()

      utterance.onend = () => {
        setPosition(total)
        finish()
      }
      utterance.onerror = () => {
        finish()
      }

      speechSynthesis.speak(utterance)
      setStatus('playing')

      stopLoops()
      rafRef.current = window.setInterval(() => {
        const elapsed = speechElapsedRef.current + (Date.now() - speechStartRef.current) / 1000
        setPosition(Math.min(total, elapsed))
      }, 200)
      // Chrome silently halts long utterances; a periodic resume keeps it alive.
      keepAliveRef.current = window.setInterval(() => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
          speechSynthesis.pause()
          speechSynthesis.resume()
        }
      }, 9000)
    },
    [transcript, estimatedSeconds, finish, stopLoops],
  )

  const play = useCallback(() => {
    setError(null)
    if (status === 'paused') {
      if (mode === 'file' && audioRef.current) {
        startFilePlayback(audioRef.current, false)
      } else {
        speechStartRef.current = Date.now()
        if (typeof speechSynthesis !== 'undefined' && speechSynthesis.paused) {
          speechSynthesis.resume()
          setStatus('playing')
          stopLoops()
          rafRef.current = window.setInterval(() => {
            const elapsed = speechElapsedRef.current + (Date.now() - speechStartRef.current) / 1000
            setPosition(Math.min(duration, elapsed))
          }, 200)
        } else {
          startSpeechPlayback(false)
        }
      }
      return
    }

    if (limitReached || status === 'playing' || status === 'loading') return

    callbacksRef.current.onPlayStart(clipId)
    setPosition(0)
    if (mode === 'file' && audioRef.current) startFilePlayback(audioRef.current, true)
    else startSpeechPlayback(true)
  }, [
    status,
    mode,
    limitReached,
    clipId,
    duration,
    startFilePlayback,
    startSpeechPlayback,
    stopLoops,
  ])

  const pause = useCallback(() => {
    if (status !== 'playing') return
    if (mode === 'file' && audioRef.current) {
      audioRef.current.pause()
    } else if (typeof speechSynthesis !== 'undefined') {
      speechElapsedRef.current += (Date.now() - speechStartRef.current) / 1000
      speechSynthesis.pause()
    }
    stopLoops()
    setStatus('paused')
  }, [status, mode, stopLoops])

  return useMemo(
    () => ({
      status,
      mode,
      duration,
      position,
      progress: duration > 0 ? Math.min(1, position / duration) : 0,
      playsUsed,
      playsRemaining: Math.max(0, maxPlays - playsUsed),
      limitReached,
      canStart: !limitReached && status !== 'playing' && status !== 'loading',
      play,
      pause,
      error,
    }),
    [status, mode, duration, position, playsUsed, maxPlays, limitReached, play, pause, error],
  )
}
