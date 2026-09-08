import type { IntegrityEventType, QuestionType, SkillId } from '@/types'

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  tfng: 'True / False / Not Given',
  summary: 'Summary Completion',
  'main-idea': 'Main Idea',
  inference: 'Inference',
  mcq: 'Multiple Choice',
  detail: 'Detail',
  vocabulary: 'Vocabulary',
  context: 'Context',
}

/** Every module is capped at 20 minutes. */
export const MODULE_SECONDS = 20 * 60

export const FULL_TEST_PLAN: SkillId[] = ['listening', 'reading', 'writing', 'speaking']

export const SKILL_LABELS: Record<SkillId, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export const SKILL_ROUTES: Record<SkillId, string> = {
  listening: '/test/listening',
  reading: '/test/reading',
  writing: '/test/writing',
  speaking: '/test/speaking',
}

export const SKILL_ACCENTS: Record<SkillId, string> = {
  listening: '#6366f1',
  reading: '#0ea5e9',
  writing: '#f59e0b',
  speaking: '#10b981',
}

/** Modules that run camera-only proctoring. Speaking uses the microphone instead. */
export const CAMERA_MONITORED_SKILLS: SkillId[] = ['reading', 'listening', 'writing']

export const MAX_AUDIO_PLAYS = 2

export const PLAYBACK_LIMIT_MESSAGE = 'Maximum playback limit reached'

/** Integrity deductions applied per event occurrence. */
export const INTEGRITY_PENALTIES: Record<IntegrityEventType, number> = {
  'face-lost': 4,
  'face-returned': 0,
  'multiple-faces': 12,
  'head-turn': 2,
  'gaze-deviation': 1.5,
  'long-absence': 10,
  'tab-switch': 8,
  'window-blur': 4,
  'fullscreen-exit': 6,
  'camera-denied': 15,
  'monitor-unavailable': 0,
}

export const INTEGRITY_EVENT_LABELS: Record<IntegrityEventType, string> = {
  'face-lost': 'Face Lost',
  'face-returned': 'User Returned',
  'multiple-faces': 'Multiple Faces Detected',
  'head-turn': 'Excessive Head Turn',
  'gaze-deviation': 'Gaze Deviation',
  'long-absence': 'Long Absence From Camera',
  'tab-switch': 'Tab Switch',
  'window-blur': 'Window Focus Lost',
  'fullscreen-exit': 'Fullscreen Exited',
  'camera-denied': 'Camera Permission Denied',
  'monitor-unavailable': 'Monitoring Unavailable',
}

export const AUTOSAVE_DEBOUNCE_MS = 600
