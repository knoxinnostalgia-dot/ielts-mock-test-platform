import { useCallback, useEffect, useRef, useState } from 'react'
import type { Detection, FaceDetector as FaceDetectorType } from '@mediapipe/tasks-vision'

import type { IntegrityEventType } from '@/types'
import { publicUrl } from '@/utils/publicUrl'

import wasmLoaderUrl from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import wasmBinaryUrl from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'

/** Checked first so the platform can run fully offline if the model is vendored. */
const LOCAL_MODEL_URL = publicUrl('models/blaze_face_short_range.tflite')
const CDN_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

export type MonitorStatus =
  | 'idle'
  | 'requesting'
  | 'loading-model'
  | 'active'
  | 'denied'
  | 'unavailable'

export interface FaceMonitorSnapshot {
  faceCount: number
  facePresent: boolean
  /** 0-1 estimate of how far the head is turned away from the camera. */
  headTurn: number
  /** 0-1 estimate of how far the gaze has drifted from the screen. */
  gazeDeviation: number
}

export interface FaceMonitorController extends FaceMonitorSnapshot {
  status: MonitorStatus
  /** True when MediaPipe loaded; false means camera-only with no analysis. */
  analysisAvailable: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

export interface FaceMonitorOptions {
  enabled: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  onEvent: (type: IntegrityEventType, message: string) => void
  /** Reports elapsed monitored time and how much of it had no face in frame. */
  onSample: (seconds: number, secondsWithoutFace: number) => void
  onPermission: (granted: boolean) => void
}

const DETECT_INTERVAL_MS = 220
const FACE_LOST_AFTER_MS = 1_500
const LONG_ABSENCE_AFTER_MS = 10_000
const MULTI_FACE_AFTER_MS = 1_200
const HEAD_TURN_AFTER_MS = 1_800
const GAZE_AFTER_MS = 2_400
const EVENT_COOLDOWN_MS = 12_000
const SAMPLE_INTERVAL_MS = 5_000

const HEAD_TURN_THRESHOLD = 0.42
const GAZE_THRESHOLD = 0.3

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Derives coarse head-pose and gaze signals from BlazeFace keypoints.
 * Keypoint order is [right eye, left eye, nose tip, mouth, right ear, left ear].
 */
function analyseDetection(detection: Detection): { headTurn: number; gaze: number } {
  const keypoints = detection.keypoints ?? []
  if (keypoints.length < 6) return { headTurn: 0, gaze: 0 }

  const [rightEye, leftEye, nose, , rightEar, leftEar] = keypoints
  const toRight = distance(nose, rightEar)
  const toLeft = distance(nose, leftEar)
  const span = toRight + toLeft
  const headTurn = span > 0 ? Math.min(1, Math.abs(toRight - toLeft) / span / 0.5) : 0

  const box = detection.boundingBox
  const eyeMidX = (rightEye.x + leftEye.x) / 2
  const eyeMidY = (rightEye.y + leftEye.y) / 2

  // Gaze proxy: how far the eye midpoint sits from the centre of the frame,
  // scaled by face size so distance from the camera does not skew the value.
  let gaze = 0
  if (box) {
    const faceWidth = box.width || 0.2
    const offsetX = Math.abs(eyeMidX - 0.5) / Math.max(0.15, faceWidth * 1.6)
    const offsetY = Math.abs(eyeMidY - 0.45) / Math.max(0.15, faceWidth * 1.8)
    gaze = Math.min(1, Math.hypot(offsetX, offsetY))
  }

  return { headTurn, gaze }
}

export function useFaceMonitor(options: FaceMonitorOptions): FaceMonitorController {
  const { enabled, videoRef, onEvent, onSample, onPermission } = options

  const [status, setStatus] = useState<MonitorStatus>('idle')
  const [analysisAvailable, setAnalysisAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<FaceMonitorSnapshot>({
    faceCount: 0,
    facePresent: false,
    headTurn: 0,
    gazeDeviation: 0,
  })

  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<FaceDetectorType | null>(null)
  const loopRef = useRef<number | undefined>(undefined)
  const runningRef = useRef(false)
  /** Guards against overlapping start/stop cycles (React StrictMode remounts). */
  const runIdRef = useRef(0)

  const callbacks = useRef({ onEvent, onSample, onPermission })
  callbacks.current = { onEvent, onSample, onPermission }

  const timers = useRef({
    faceMissingSince: 0,
    faceLostReported: false,
    longAbsenceReported: false,
    multiFaceSince: 0,
    headTurnSince: 0,
    gazeSince: 0,
    lastMultiFaceEvent: 0,
    lastHeadTurnEvent: 0,
    lastGazeEvent: 0,
    lastSampleAt: 0,
    accumulatedNoFaceMs: 0,
    lastFrameAt: 0,
  })

  const stop = useCallback(() => {
    runningRef.current = false
    runIdRef.current += 1
    if (loopRef.current) window.clearInterval(loopRef.current)
    loopRef.current = undefined
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    detectorRef.current?.close()
    detectorRef.current = null
    setStatus('idle')
    setSnapshot({ faceCount: 0, facePresent: false, headTurn: 0, gazeDeviation: 0 })
  }, [])

  const loadDetector = useCallback(async (): Promise<FaceDetectorType | null> => {
    try {
      const { FaceDetector } = await import('@mediapipe/tasks-vision')
      // The Wasm runtime is bundled from node_modules rather than a CDN so the
      // detector keeps working without a network connection.
      const fileset = {
        wasmLoaderPath: new URL(wasmLoaderUrl, window.location.href).href,
        wasmBinaryPath: new URL(wasmBinaryUrl, window.location.href).href,
      }

      const localAvailable = await fetch(LOCAL_MODEL_URL, { method: 'HEAD' })
        .then((response) => response.ok && response.headers.get('content-type') !== 'text/html')
        .catch(() => false)

      const modelAssetPath = localAvailable ? LOCAL_MODEL_URL : CDN_MODEL_URL

      const create = (delegate: 'GPU' | 'CPU') =>
        FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath, delegate },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.45,
        })

      try {
        return await create('GPU')
      } catch {
        return await create('CPU')
      }
    } catch (loadError) {
      console.warn('[proctor] face analysis unavailable', loadError)
      return null
    }
  }, [])

  const start = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    const runId = ++runIdRef.current
    const isStale = () => runIdRef.current !== runId
    setError(null)
    setStatus('requesting')

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      setError('This browser does not expose a camera API.')
      callbacks.current.onEvent('monitor-unavailable', 'Camera monitoring is not supported here')
      runningRef.current = false
      return
    }

    let stream: MediaStream
    try {
      // Video only. Audio is never requested by the proctoring monitor.
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
        audio: false,
      })
    } catch (mediaError) {
      console.warn('[proctor] camera denied', mediaError)
      setStatus('denied')
      setError('Camera access was denied. The test continues, but integrity cannot be verified.')
      callbacks.current.onPermission(false)
      callbacks.current.onEvent('camera-denied', 'Camera permission denied')
      runningRef.current = false
      return
    }

    if (isStale()) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    streamRef.current = stream
    callbacks.current.onPermission(true)

    const video = videoRef.current
    if (video) {
      video.srcObject = stream
      video.muted = true
      try {
        await video.play()
      } catch {
        /* autoplay restrictions are non-fatal for a muted preview */
      }
    }

    setStatus('loading-model')
    const detector = await loadDetector()
    if (isStale()) {
      detector?.close()
      return
    }

    detectorRef.current = detector
    setAnalysisAvailable(!!detector)
    setStatus('active')

    if (!detector) {
      setError('Face analysis could not be loaded. The camera preview stays on and focus monitoring continues.')
      callbacks.current.onEvent(
        'monitor-unavailable',
        'Face analysis model unavailable — camera preview only',
      )
    }

    timers.current.lastSampleAt = Date.now()
    timers.current.lastFrameAt = Date.now()

    loopRef.current = window.setInterval(() => {
      const now = Date.now()
      const frameGap = now - timers.current.lastFrameAt
      timers.current.lastFrameAt = now

      const currentVideo = videoRef.current
      const activeDetector = detectorRef.current

      let detections: Detection[] = []
      if (activeDetector && currentVideo && currentVideo.readyState >= 2) {
        try {
          detections = activeDetector.detectForVideo(currentVideo, now).detections ?? []
        } catch (detectError) {
          console.warn('[proctor] detection failed', detectError)
        }
      }

      if (!activeDetector) {
        // Without analysis we still record monitored time so the report is honest.
        if (now - timers.current.lastSampleAt >= SAMPLE_INTERVAL_MS) {
          callbacks.current.onSample((now - timers.current.lastSampleAt) / 1000, 0)
          timers.current.lastSampleAt = now
        }
        return
      }

      const faceCount = detections.length
      const facePresent = faceCount > 0
      const primary = detections[0]
      const analysis = primary ? analyseDetection(primary) : { headTurn: 0, gaze: 0 }

      setSnapshot({
        faceCount,
        facePresent,
        headTurn: analysis.headTurn,
        gazeDeviation: analysis.gaze,
      })

      const state = timers.current

      if (!facePresent) {
        state.accumulatedNoFaceMs += frameGap
        if (state.faceMissingSince === 0) state.faceMissingSince = now
        const missingFor = now - state.faceMissingSince
        if (missingFor >= FACE_LOST_AFTER_MS && !state.faceLostReported) {
          state.faceLostReported = true
          callbacks.current.onEvent('face-lost', 'Face no longer visible in the camera frame')
        }
        if (missingFor >= LONG_ABSENCE_AFTER_MS && !state.longAbsenceReported) {
          state.longAbsenceReported = true
          callbacks.current.onEvent('long-absence', 'Candidate absent from camera for over 10 seconds')
        }
      } else {
        if (state.faceLostReported) {
          callbacks.current.onEvent('face-returned', 'Candidate returned to the camera frame')
        }
        state.faceMissingSince = 0
        state.faceLostReported = false
        state.longAbsenceReported = false
      }

      if (faceCount > 1) {
        if (state.multiFaceSince === 0) state.multiFaceSince = now
        if (
          now - state.multiFaceSince >= MULTI_FACE_AFTER_MS &&
          now - state.lastMultiFaceEvent >= EVENT_COOLDOWN_MS
        ) {
          state.lastMultiFaceEvent = now
          callbacks.current.onEvent('multiple-faces', `${faceCount} people detected in frame`)
        }
      } else {
        state.multiFaceSince = 0
      }

      if (facePresent && analysis.headTurn >= HEAD_TURN_THRESHOLD) {
        if (state.headTurnSince === 0) state.headTurnSince = now
        if (
          now - state.headTurnSince >= HEAD_TURN_AFTER_MS &&
          now - state.lastHeadTurnEvent >= EVENT_COOLDOWN_MS
        ) {
          state.lastHeadTurnEvent = now
          callbacks.current.onEvent('head-turn', 'Sustained head turn away from the screen')
        }
      } else {
        state.headTurnSince = 0
      }

      if (facePresent && analysis.gaze >= GAZE_THRESHOLD && analysis.headTurn < HEAD_TURN_THRESHOLD) {
        if (state.gazeSince === 0) state.gazeSince = now
        if (
          now - state.gazeSince >= GAZE_AFTER_MS &&
          now - state.lastGazeEvent >= EVENT_COOLDOWN_MS
        ) {
          state.lastGazeEvent = now
          callbacks.current.onEvent('gaze-deviation', 'Gaze repeatedly directed away from the screen')
        }
      } else {
        state.gazeSince = 0
      }

      if (now - state.lastSampleAt >= SAMPLE_INTERVAL_MS) {
        callbacks.current.onSample(
          (now - state.lastSampleAt) / 1000,
          state.accumulatedNoFaceMs / 1000,
        )
        state.lastSampleAt = now
        state.accumulatedNoFaceMs = 0
      }
    }, DETECT_INTERVAL_MS)
  }, [videoRef, loadDetector])

  useEffect(() => {
    if (!enabled) return
    void start()
    return stop
  }, [enabled, start, stop])

  return {
    ...snapshot,
    status,
    analysisAvailable,
    error,
    start,
    stop,
  }
}
