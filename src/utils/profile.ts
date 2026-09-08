import type {
  CandidateProfile,
  Difficulty,
  SkillId,
  StreakState,
  TestResult,
} from '@/types'
import { cefrRank, scoreToCEFR } from './cefr'
import { SKILL_LABELS } from './constants'
import { daysBetween, toDayKey } from './time'

export function createProfile(): CandidateProfile {
  return {
    name: 'Candidate',
    difficulty: 'intermediate',
    adaptiveDifficulty: 'intermediate',
    autoAdapt: true,
    streak: { current: 0, longest: 0, lastPracticeDate: null, history: [] },
    achievements: [],
    results: [],
  }
}

/** Advances the streak for today; idempotent within the same calendar day. */
export function registerPracticeDay(streak: StreakState, today = toDayKey()): StreakState {
  if (streak.lastPracticeDate === today) return streak
  const gap = streak.lastPracticeDate ? daysBetween(streak.lastPracticeDate, today) : null
  const current = gap === 1 ? streak.current + 1 : 1
  const history = streak.history.includes(today) ? streak.history : [...streak.history, today]
  return {
    current,
    longest: Math.max(streak.longest, current),
    lastPracticeDate: today,
    history: history.slice(-400),
  }
}

/** A streak only survives until the end of the following day. */
export function normaliseStreak(streak: StreakState, today = toDayKey()): StreakState {
  if (!streak.lastPracticeDate) return streak
  const gap = daysBetween(streak.lastPracticeDate, today)
  if (gap <= 1) return streak
  return { ...streak, current: 0 }
}

const DIFFICULTY_ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced']

/**
 * Adaptive difficulty: two consecutive strong performances promote the
 * candidate, two weak ones demote them. Anything in between holds steady.
 */
export function nextAdaptiveDifficulty(
  current: Difficulty,
  results: TestResult[],
): Difficulty {
  const recent = results.slice(-2)
  if (recent.length < 1) return current
  const index = DIFFICULTY_ORDER.indexOf(current)
  const allStrong = recent.length === 2 && recent.every((result) => result.overallScore >= 80)
  const allWeak = recent.length === 2 && recent.every((result) => result.overallScore < 50)
  if (allStrong && index < DIFFICULTY_ORDER.length - 1) return DIFFICULTY_ORDER[index + 1]
  if (allWeak && index > 0) return DIFFICULTY_ORDER[index - 1]
  return current
}

export function activeDifficulty(profile: CandidateProfile): Difficulty {
  return profile.autoAdapt ? profile.adaptiveDifficulty : profile.difficulty
}

export interface ProfileStats {
  totalTests: number
  averageScore: number
  averageCefr: ReturnType<typeof scoreToCEFR>
  bestSkill: SkillId | null
  weakestSkill: SkillId | null
  skillAverages: Record<SkillId, number | null>
  averageIntegrity: number | null
  lastResult: TestResult | null
  trend: { at: number; score: number }[]
}

export function computeProfileStats(profile: CandidateProfile): ProfileStats {
  const results = profile.results
  const skills: SkillId[] = ['listening', 'reading', 'writing', 'speaking']

  const skillAverages = skills.reduce<Record<SkillId, number | null>>(
    (acc, skill) => {
      const values = results
        .map((result) => result[skill]?.score)
        .filter((value): value is number => typeof value === 'number')
      acc[skill] = values.length
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : null
      return acc
    },
    { listening: null, reading: null, writing: null, speaking: null },
  )

  const rated = skills
    .map((skill) => ({ skill, value: skillAverages[skill] }))
    .filter((item): item is { skill: SkillId; value: number } => item.value !== null)
    .sort((a, b) => b.value - a.value)

  const integrityValues = results
    .filter((result) => result.proctor.monitoredSeconds > 0 || result.proctor.focusViolations > 0)
    .map((result) => result.proctor.integrityScore)

  const averageScore = results.length
    ? Math.round(results.reduce((sum, result) => sum + result.overallScore, 0) / results.length)
    : 0

  return {
    totalTests: results.length,
    averageScore,
    averageCefr: scoreToCEFR(averageScore),
    bestSkill: rated[0]?.skill ?? null,
    weakestSkill: rated.length > 1 ? rated[rated.length - 1].skill : null,
    skillAverages,
    averageIntegrity: integrityValues.length
      ? Math.round(integrityValues.reduce((sum, value) => sum + value, 0) / integrityValues.length)
      : null,
    lastResult: results.length ? results[results.length - 1] : null,
    trend: results.slice(-12).map((result) => ({ at: result.completedAt, score: result.overallScore })),
  }
}

export function skillLabel(skill: SkillId | null): string {
  return skill ? SKILL_LABELS[skill] : '—'
}

export function compareCefr(a: TestResult, b: TestResult): number {
  return cefrRank(a.cefr) - cefrRank(b.cefr)
}
