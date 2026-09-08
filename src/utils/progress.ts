import { getListeningSection } from '@/data/listeningSections'
import { getReadingPassage } from '@/data/readingPassages'
import { getSpeakingTaskSet } from '@/data/speakingTasks'
import { getWritingPrompt } from '@/data/writingPrompts'
import type { SkillId, TestSession } from '@/types'
import { htmlToPlainText } from './html'
import { clamp, countWords } from './text'

/** Fraction 0-1 of a single module that the candidate has completed. */
export function sectionProgress(session: TestSession, skill: SkillId): number {
  switch (skill) {
    case 'reading': {
      const state = session.reading
      if (!state) return 0
      if (state.status === 'submitted' || state.status === 'expired') return 1
      const total = getReadingPassage(state.passageId).questions.length
      return total === 0 ? 0 : Object.keys(state.answers).length / total
    }
    case 'listening': {
      const state = session.listening
      if (!state) return 0
      if (state.status === 'submitted' || state.status === 'expired') return 1
      const total = getListeningSection(state.sectionId).questions.length
      return total === 0 ? 0 : Object.keys(state.answers).length / total
    }
    case 'writing': {
      const state = session.writing
      if (!state) return 0
      if (state.status === 'submitted' || state.status === 'expired') return 1
      const prompt = getWritingPrompt(state.promptId)
      return clamp(countWords(htmlToPlainText(state.text)) / prompt.minWords, 0, 1)
    }
    case 'speaking': {
      const state = session.speaking
      if (!state) return 0
      if (state.status === 'submitted' || state.status === 'expired') return 1
      const taskSet = getSpeakingTaskSet(state.taskSetId)
      const total = taskSet.repeatSentences.length + 1
      const done =
        Object.keys(state.repeatRecordings).length + (state.cueCardRecording ? 1 : 0)
      return clamp(done / total, 0, 1)
    }
    default:
      return 0
  }
}

/** Whole-session completion percentage shown in the exam navigation bar. */
export function sessionProgress(session: TestSession): number {
  if (session.plan.length === 0) return 0
  const total = session.plan.reduce((sum, skill) => sum + sectionProgress(session, skill), 0)
  return Math.round((total / session.plan.length) * 100)
}

export function isSectionLocked(session: TestSession, skill: SkillId): boolean {
  const state = session[skill]
  return !!state && (state.status === 'submitted' || state.status === 'expired')
}

export function nextPendingSkill(session: TestSession): SkillId | null {
  return session.plan.find((skill) => !isSectionLocked(session, skill)) ?? null
}
