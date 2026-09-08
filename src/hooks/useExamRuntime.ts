import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useProfile } from '@/context/profile'
import { useSession } from '@/context/session'
import type { IntegrityEventType, SkillId } from '@/types'
import { CAMERA_MONITORED_SKILLS, MODULE_SECONDS, SKILL_ROUTES } from '@/utils/constants'
import { nextPendingSkill, sectionProgress, sessionProgress } from '@/utils/progress'
import { STORAGE_KEYS, writeJSON } from '@/utils/storage'
import { useCountdown } from './useCountdown'
import { useFaceMonitor, type FaceMonitorController } from './useFaceMonitor'
import { useFocusMonitor } from './useFocusMonitor'
import { useFullscreen } from './useFullscreen'

export type ExamPhase = 'briefing' | 'active' | 'finished'

export interface ExamRuntime {
  phase: ExamPhase
  ready: boolean
  locked: boolean
  secondsRemaining: number
  sectionPercent: number
  overallPercent: number
  cameraRequired: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  monitor: FaceMonitorController
  fullscreenActive: boolean
  fullscreenSupported: boolean
  fullscreenWarningOpen: boolean
  dismissFullscreenWarning: () => void
  returnToFullscreen: () => void
  begin: () => Promise<void>
  starting: boolean
  exitModalOpen: boolean
  requestExit: () => void
  cancelExit: () => void
  confirmExit: () => void
  submitModalOpen: boolean
  requestSubmit: () => void
  cancelSubmit: () => void
  confirmSubmit: () => void
  timeUpOpen: boolean
  acknowledgeTimeUp: () => void
  logEvent: (type: IntegrityEventType, message: string) => void
}

/**
 * Shared behaviour for every exam module: the 20-minute clock, the fullscreen
 * requirement, camera and focus proctoring, submission and hand-off to the next
 * module in a full test.
 */
export function useExamRuntime(skill: SkillId): ExamRuntime {
  const navigate = useNavigate()
  const { commitResult } = useProfile()
  const {
    session,
    ensureSection,
    syncTimer,
    submitSection,
    logEvent,
    setCameraGranted,
    addMonitoredTime,
    finalizeSession,
    clearSession,
  } = useSession()

  const sectionState = session?.[skill] ?? null
  const alreadyClosed = sectionState?.status === 'submitted' || sectionState?.status === 'expired'

  const [phase, setPhase] = useState<ExamPhase>(alreadyClosed ? 'finished' : 'briefing')
  const [starting, setStarting] = useState(false)
  const [exitModalOpen, setExitModalOpen] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [timeUpOpen, setTimeUpOpen] = useState(false)
  const [fullscreenWarningOpen, setFullscreenWarningOpen] = useState(false)
  const [pendingAdvance, setPendingAdvance] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const cameraRequired = CAMERA_MONITORED_SKILLS.includes(skill)

  /* ---------------------------------------------------------------- */
  /* Fullscreen                                                        */
  /* ---------------------------------------------------------------- */

  const handleFullscreenExit = useCallback(() => {
    if (phaseRef.current !== 'active') return
    logEvent('fullscreen-exit', 'Candidate left fullscreen exam mode')
    setFullscreenWarningOpen(true)
  }, [logEvent])

  const fullscreen = useFullscreen(handleFullscreenExit)

  /* ---------------------------------------------------------------- */
  /* Focus monitoring                                                  */
  /* ---------------------------------------------------------------- */

  useFocusMonitor(phase === 'active', {
    onTabSwitch: () => logEvent('tab-switch', 'Exam tab was hidden or minimised'),
    onWindowBlur: () => logEvent('window-blur', 'Browser window lost focus'),
  })

  /* ---------------------------------------------------------------- */
  /* Camera proctoring (video only)                                    */
  /* ---------------------------------------------------------------- */

  const monitor = useFaceMonitor({
    enabled: cameraRequired && phase === 'active',
    videoRef,
    onEvent: logEvent,
    onSample: addMonitoredTime,
    onPermission: setCameraGranted,
  })

  /* ---------------------------------------------------------------- */
  /* Countdown                                                         */
  /* ---------------------------------------------------------------- */

  const initialSeconds = sectionState?.secondsRemaining ?? MODULE_SECONDS
  const syncCounter = useRef(0)

  const handleExpire = useCallback(() => {
    submitSection(skill, 'expired')
    setPhase('finished')
    setTimeUpOpen(true)
  }, [skill, submitSection])

  const handleTick = useCallback(
    (secondsLeft: number) => {
      syncCounter.current += 1
      // Persisting every five seconds keeps localStorage writes cheap while
      // still surviving an unexpected refresh.
      if (syncCounter.current % 5 === 0 || secondsLeft <= 10) syncTimer(skill, secondsLeft)
    },
    [skill, syncTimer],
  )

  const countdown = useCountdown({
    initialSeconds,
    autoStart: false,
    onExpire: handleExpire,
    onTick: handleTick,
  })

  const { reset: resetCountdown, start: startCountdown, pause: pauseCountdown } = countdown

  useEffect(() => {
    return () => {
      pauseCountdown()
    }
  }, [pauseCountdown])

  /* ---------------------------------------------------------------- */
  /* Start / submit / advance                                          */
  /* ---------------------------------------------------------------- */

  const begin = useCallback(async () => {
    if (!session) return
    setStarting(true)
    if (fullscreen.supported && !fullscreen.isFullscreen) {
      await fullscreen.request()
    }
    ensureSection(skill)
    const seconds = session[skill]?.secondsRemaining ?? MODULE_SECONDS
    resetCountdown(seconds)
    setPhase('active')
    startCountdown()
    setStarting(false)
  }, [session, skill, ensureSection, fullscreen, resetCountdown, startCountdown])

  const finishSection = useCallback(() => {
    pauseCountdown()
    submitSection(skill, 'manual')
    setPhase('finished')
    setPendingAdvance(true)
  }, [pauseCountdown, skill, submitSection])

  const advance = useCallback(() => {
    if (!session) {
      navigate('/')
      return
    }
    const remaining = nextPendingSkill(session)
    if (session.mode === 'full' && remaining && remaining !== skill) {
      navigate(SKILL_ROUTES[remaining])
      return
    }
    const result = finalizeSession()
    if (result) {
      commitResult(result)
      writeJSON(STORAGE_KEYS.lastResult, result)
      // Navigate before clearing so the exam screen unmounts in the same batch
      // and never renders against a null session.
      navigate(`/results/${result.id}`)
      clearSession()
    } else {
      navigate('/')
    }
  }, [session, skill, navigate, finalizeSession, commitResult, clearSession])

  useEffect(() => {
    if (!pendingAdvance) return
    if (!sectionState) return
    if (sectionState.status !== 'submitted' && sectionState.status !== 'expired') return
    setPendingAdvance(false)
    advance()
  }, [pendingAdvance, sectionState, advance])

  const acknowledgeTimeUp = useCallback(() => {
    setTimeUpOpen(false)
    setPendingAdvance(true)
  }, [])

  const confirmSubmit = useCallback(() => {
    setSubmitModalOpen(false)
    finishSection()
  }, [finishSection])

  const confirmExit = useCallback(() => {
    pauseCountdown()
    syncTimer(skill, countdown.secondsRemaining)
    setExitModalOpen(false)
    void fullscreen.exit()
    navigate('/')
  }, [pauseCountdown, syncTimer, skill, countdown.secondsRemaining, fullscreen, navigate])

  const returnToFullscreen = useCallback(() => {
    setFullscreenWarningOpen(false)
    void fullscreen.request()
  }, [fullscreen])

  /* ---------------------------------------------------------------- */

  const sectionPercent = useMemo(
    () => (session ? Math.round(sectionProgress(session, skill) * 100) : 0),
    [session, skill],
  )
  const overallPercent = useMemo(() => (session ? sessionProgress(session) : 0), [session])

  return {
    phase,
    ready: !!sectionState && phase === 'active',
    locked: phase !== 'active',
    secondsRemaining: countdown.secondsRemaining,
    sectionPercent,
    overallPercent,
    cameraRequired,
    videoRef,
    monitor,
    fullscreenActive: fullscreen.isFullscreen,
    fullscreenSupported: fullscreen.supported,
    fullscreenWarningOpen,
    dismissFullscreenWarning: () => setFullscreenWarningOpen(false),
    returnToFullscreen,
    begin,
    starting,
    exitModalOpen,
    requestExit: () => setExitModalOpen(true),
    cancelExit: () => setExitModalOpen(false),
    confirmExit,
    submitModalOpen,
    requestSubmit: () => setSubmitModalOpen(true),
    cancelSubmit: () => setSubmitModalOpen(false),
    confirmSubmit,
    timeUpOpen,
    acknowledgeTimeUp,
    logEvent,
  }
}