import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { listeningSectionForDifficulty } from '@/data/listeningSections'
import { readingPassageForDifficulty } from '@/data/readingPassages'
import { speakingTaskSetForDifficulty } from '@/data/speakingTasks'
import { pickWritingPrompt } from '@/data/writingPrompts'
import type {
  IntegrityEvent,
  IntegrityEventType,
  RecordingMeta,
  SectionStatus,
  SkillId,
  TestResult,
  TestSession,
} from '@/types'
import { INTEGRITY_EVENT_LABELS, MODULE_SECONDS } from '@/utils/constants'
import { createId } from '@/utils/id'
import { applyIntegrityEvent, buildResult, computeIntegrityScore, emptyProctorSummary } from '@/utils/scoring'
import { STORAGE_KEYS, readJSON, removeKey, writeJSON } from '@/utils/storage'
import { SessionContext, type SessionContextValue, type StartSessionOptions } from './session'

const CRITICAL_EVENTS: IntegrityEventType[] = ['multiple-faces', 'long-absence', 'camera-denied']
const WARNING_EVENTS: IntegrityEventType[] = [
  'face-lost',
  'tab-switch',
  'window-blur',
  'fullscreen-exit',
  'head-turn',
  'gaze-deviation',
]

function defaultSeverity(type: IntegrityEventType): IntegrityEvent['severity'] {
  if (CRITICAL_EVENTS.includes(type)) return 'critical'
  if (WARNING_EVENTS.includes(type)) return 'warning'
  return 'info'
}

function closeSection<T extends { status: SectionStatus } | null>(state: T): T {
  if (!state) return state
  return state.status === 'active' ? ({ ...state, status: 'submitted' } as T) : state
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TestSession | null>(null)
  const [hydrating, setHydrating] = useState(true)
  const sessionRef = useRef<TestSession | null>(null)

  sessionRef.current = session

  useEffect(() => {
    const stored = readJSON<TestSession | null>(STORAGE_KEYS.session, null)
    if (stored && stored.id) {
      setSession({ ...stored, proctor: { ...emptyProctorSummary(), ...stored.proctor } })
    }
    setHydrating(false)
  }, [])

  useEffect(() => {
    if (hydrating) return
    if (session) writeJSON(STORAGE_KEYS.session, session)
    else removeKey(STORAGE_KEYS.session)
  }, [session, hydrating])

  const startSession = useCallback((options: StartSessionOptions) => {
    const next: TestSession = {
      id: createId('session'),
      mode: options.mode,
      difficulty: options.difficulty,
      candidateName: options.candidateName,
      createdAt: Date.now(),
      variantIndex: options.variantIndex ?? 0,
      plan: options.skills,
      activeSkill: options.skills[0] ?? null,
      reading: null,
      listening: null,
      writing: null,
      speaking: null,
      proctor: emptyProctorSummary(),
      completedAt: null,
    }
    setSession(next)
    sessionRef.current = next
    return next
  }, [])

  const clearSession = useCallback(() => {
    setSession(null)
    sessionRef.current = null
    removeKey(STORAGE_KEYS.session)
  }, [])

  const patch = useCallback((updater: (current: TestSession) => TestSession) => {
    setSession((current) => (current ? updater(current) : current))
  }, [])

  const ensureSection = useCallback(
    (skill: SkillId) => {
      patch((current) => {
        if (current[skill]) {
          const existing = current[skill]
          if (existing && existing.status === 'pending') {
            return {
              ...current,
              activeSkill: skill,
              [skill]: { ...existing, status: 'active', startedAt: Date.now() },
            } as TestSession
          }
          return current.activeSkill === skill ? current : { ...current, activeSkill: skill }
        }

        const now = Date.now()
        const base = { status: 'active' as const, secondsRemaining: MODULE_SECONDS, startedAt: now, submittedAt: null }

        switch (skill) {
          case 'reading':
            return {
              ...current,
              activeSkill: skill,
              reading: {
                passageId: readingPassageForDifficulty(current.difficulty).id,
                answers: {},
                flagged: [],
                currentIndex: 0,
                ...base,
              },
            }
          case 'listening':
            return {
              ...current,
              activeSkill: skill,
              listening: {
                sectionId: listeningSectionForDifficulty(current.difficulty).id,
                answers: {},
                flagged: [],
                currentIndex: 0,
                playCounts: {},
                ...base,
              },
            }
          case 'writing':
            return {
              ...current,
              activeSkill: skill,
              writing: {
                promptId: pickWritingPrompt(current.difficulty, current.variantIndex).id,
                text: '',
                lastSavedAt: null,
                ...base,
              },
            }
          case 'speaking':
            return {
              ...current,
              activeSkill: skill,
              speaking: {
                taskSetId: speakingTaskSetForDifficulty(current.difficulty).id,
                playCounts: {},
                repeatRecordings: {},
                cueCardRecording: null,
                currentPart: 1,
                currentTaskIndex: 0,
                ...base,
              },
            }
          default:
            return current
        }
      })
    },
    [patch],
  )

  const setActiveSkill = useCallback(
    (skill: SkillId | null) => patch((current) => ({ ...current, activeSkill: skill })),
    [patch],
  )

  const answerQuestion = useCallback(
    (skill: 'reading' | 'listening', questionId: string, optionIndex: number) => {
      patch((current) => {
        const state = current[skill]
        if (!state || state.status !== 'active') return current
        return {
          ...current,
          [skill]: { ...state, answers: { ...state.answers, [questionId]: optionIndex } },
        } as TestSession
      })
    },
    [patch],
  )

  const toggleFlag = useCallback(
    (skill: 'reading' | 'listening', questionId: string) => {
      patch((current) => {
        const state = current[skill]
        if (!state) return current
        const flagged = state.flagged.includes(questionId)
          ? state.flagged.filter((id) => id !== questionId)
          : [...state.flagged, questionId]
        return { ...current, [skill]: { ...state, flagged } } as TestSession
      })
    },
    [patch],
  )

  const setCurrentIndex = useCallback(
    (skill: 'reading' | 'listening', index: number) => {
      patch((current) => {
        const state = current[skill]
        if (!state) return current
        return { ...current, [skill]: { ...state, currentIndex: index } } as TestSession
      })
    },
    [patch],
  )

  const registerPlay = useCallback(
    (skill: 'listening' | 'speaking', clipId: string) => {
      patch((current) => {
        const state = current[skill]
        if (!state) return current
        const playCounts = { ...state.playCounts, [clipId]: (state.playCounts[clipId] ?? 0) + 1 }
        return { ...current, [skill]: { ...state, playCounts } } as TestSession
      })
    },
    [patch],
  )

  const setWritingText = useCallback(
    (text: string) => {
      patch((current) => {
        if (!current.writing || current.writing.status !== 'active') return current
        return { ...current, writing: { ...current.writing, text, lastSavedAt: Date.now() } }
      })
    },
    [patch],
  )

  const setSpeakingPosition = useCallback(
    (part: 1 | 2, taskIndex: number) => {
      patch((current) => {
        if (!current.speaking) return current
        return { ...current, speaking: { ...current.speaking, currentPart: part, currentTaskIndex: taskIndex } }
      })
    },
    [patch],
  )

  const setRepeatRecording = useCallback(
    (taskId: string, meta: RecordingMeta) => {
      patch((current) => {
        if (!current.speaking) return current
        return {
          ...current,
          speaking: {
            ...current.speaking,
            repeatRecordings: { ...current.speaking.repeatRecordings, [taskId]: meta },
          },
        }
      })
    },
    [patch],
  )

  const setCueCardRecording = useCallback(
    (meta: RecordingMeta) => {
      patch((current) => {
        if (!current.speaking) return current
        return { ...current, speaking: { ...current.speaking, cueCardRecording: meta } }
      })
    },
    [patch],
  )

  const syncTimer = useCallback(
    (skill: SkillId, secondsRemaining: number) => {
      patch((current) => {
        const state = current[skill]
        if (!state || state.status !== 'active') return current
        if (state.secondsRemaining === secondsRemaining) return current
        return { ...current, [skill]: { ...state, secondsRemaining } } as TestSession
      })
    },
    [patch],
  )

  const submitSection = useCallback(
    (skill: SkillId, reason: 'manual' | 'expired' = 'manual') => {
      patch((current) => {
        const state = current[skill]
        if (!state || state.status === 'submitted' || state.status === 'expired') return current
        return {
          ...current,
          [skill]: {
            ...state,
            status: reason === 'expired' ? 'expired' : 'submitted',
            secondsRemaining: reason === 'expired' ? 0 : state.secondsRemaining,
            submittedAt: Date.now(),
          },
        } as TestSession
      })
    },
    [patch],
  )

  const logEvent = useCallback(
    (type: IntegrityEventType, message: string, severity?: IntegrityEvent['severity']) => {
      patch((current) => {
        const event: IntegrityEvent = {
          id: createId('evt'),
          type,
          at: Date.now(),
          skill: current.activeSkill,
          message: message || INTEGRITY_EVENT_LABELS[type],
          severity: severity ?? defaultSeverity(type),
        }
        return { ...current, proctor: applyIntegrityEvent(current.proctor, event) }
      })
    },
    [patch],
  )

  const setCameraGranted = useCallback(
    (granted: boolean) => {
      patch((current) => ({
        ...current,
        proctor: { ...current.proctor, cameraGranted: granted },
      }))
    },
    [patch],
  )

  const addMonitoredTime = useCallback(
    (seconds: number, secondsWithoutFace: number) => {
      patch((current) => {
        const proctor = {
          ...current.proctor,
          monitoredSeconds: current.proctor.monitoredSeconds + seconds,
          secondsWithoutFace: current.proctor.secondsWithoutFace + secondsWithoutFace,
        }
        return { ...current, proctor: { ...proctor, integrityScore: computeIntegrityScore(proctor) } }
      })
    },
    [patch],
  )

  const finalizeSession = useCallback((): TestResult | null => {
    const current = sessionRef.current
    if (!current) return null
    // Anything still open at the end of the session counts as submitted as-is.
    const closed: TestSession = {
      ...current,
      completedAt: Date.now(),
      reading: closeSection(current.reading),
      listening: closeSection(current.listening),
      writing: closeSection(current.writing),
      speaking: closeSection(current.speaking),
    }
    const result = buildResult(closed)
    writeJSON(STORAGE_KEYS.lastResult, result)
    return result
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      hydrating,
      startSession,
      clearSession,
      ensureSection,
      setActiveSkill,
      answerQuestion,
      toggleFlag,
      setCurrentIndex,
      registerPlay,
      setWritingText,
      setSpeakingPosition,
      setRepeatRecording,
      setCueCardRecording,
      syncTimer,
      submitSection,
      logEvent,
      setCameraGranted,
      addMonitoredTime,
      finalizeSession,
    }),
    [
      session,
      hydrating,
      startSession,
      clearSession,
      ensureSection,
      setActiveSkill,
      answerQuestion,
      toggleFlag,
      setCurrentIndex,
      registerPlay,
      setWritingText,
      setSpeakingPosition,
      setRepeatRecording,
      setCueCardRecording,
      syncTimer,
      submitSection,
      logEvent,
      setCameraGranted,
      addMonitoredTime,
      finalizeSession,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
