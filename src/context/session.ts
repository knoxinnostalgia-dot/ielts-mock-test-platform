import { createContext, useContext } from 'react'

import type {
  Difficulty,
  IntegrityEvent,
  IntegrityEventType,
  RecordingMeta,
  SkillId,
  TestMode,
  TestResult,
  TestSession,
} from '@/types'

export interface StartSessionOptions {
  mode: TestMode
  skills: SkillId[]
  difficulty: Difficulty
  candidateName: string
  /** Rotates writing prompts across repeat attempts. */
  variantIndex?: number
}

export interface SessionContextValue {
  session: TestSession | null
  /** True while the initial localStorage rehydration is in flight. */
  hydrating: boolean
  startSession: (options: StartSessionOptions) => TestSession
  clearSession: () => void
  /** Creates the per-module state the first time a module screen is opened. */
  ensureSection: (skill: SkillId) => void
  setActiveSkill: (skill: SkillId | null) => void

  answerQuestion: (skill: 'reading' | 'listening', questionId: string, optionIndex: number) => void
  toggleFlag: (skill: 'reading' | 'listening', questionId: string) => void
  setCurrentIndex: (skill: 'reading' | 'listening', index: number) => void

  registerPlay: (skill: 'listening' | 'speaking', clipId: string) => void
  setWritingText: (text: string) => void
  setSpeakingPosition: (part: 1 | 2, taskIndex: number) => void
  setRepeatRecording: (taskId: string, meta: RecordingMeta) => void
  setCueCardRecording: (meta: RecordingMeta) => void

  syncTimer: (skill: SkillId, secondsRemaining: number) => void
  submitSection: (skill: SkillId, reason?: 'manual' | 'expired') => void

  logEvent: (type: IntegrityEventType, message: string, severity?: IntegrityEvent['severity']) => void
  setCameraGranted: (granted: boolean) => void
  addMonitoredTime: (seconds: number, secondsWithoutFace: number) => void

  finalizeSession: () => TestResult | null
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used inside <SessionProvider>')
  return context
}
