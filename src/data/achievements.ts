import type { AchievementDefinition, CandidateProfile, TestResult } from '@/types'

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-test',
    title: 'First Test Completed',
    description: 'Finish and submit your first mock test of any kind.',
    icon: 'flag',
    tier: 'bronze',
  },
  {
    id: 'reading-expert',
    title: 'Reading Expert',
    description: 'Score 85% or higher on a reading section.',
    icon: 'book',
    tier: 'silver',
  },
  {
    id: 'listening-expert',
    title: 'Listening Expert',
    description: 'Score 85% or higher on a listening section.',
    icon: 'headphones',
    tier: 'silver',
  },
  {
    id: 'writing-master',
    title: 'Writing Master',
    description: 'Score 85% or higher on a writing task while staying inside the word limit.',
    icon: 'pen',
    tier: 'silver',
  },
  {
    id: 'speaking-star',
    title: 'Speaking Star',
    description: 'Complete every speaking task and stay inside the cue-card timing window.',
    icon: 'mic',
    tier: 'silver',
  },
  {
    id: 'full-mock',
    title: 'Full Mock Completed',
    description: 'Complete all four modules in a single full test.',
    icon: 'trophy',
    tier: 'gold',
  },
  {
    id: 'perfect-integrity',
    title: 'Perfect Integrity Score',
    description: 'Finish a monitored test with an integrity score of 100.',
    icon: 'shield',
    tier: 'gold',
  },
  {
    id: 'streak-7',
    title: '7 Day Practice Streak',
    description: 'Practise on seven consecutive days.',
    icon: 'flame',
    tier: 'gold',
  },
  {
    id: 'streak-30',
    title: '30 Day Practice Streak',
    description: 'Practise on thirty consecutive days.',
    icon: 'flame',
    tier: 'platinum',
  },
]

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id)
}

/** Returns the achievement ids newly satisfied by `result` given the profile state. */
export function evaluateAchievements(profile: CandidateProfile, result: TestResult): string[] {
  const unlocked = new Set(profile.achievements.map((item) => item.id))
  const earned: string[] = []

  const award = (id: string, condition: boolean) => {
    if (condition && !unlocked.has(id)) earned.push(id)
  }

  award('first-test', true)
  award('reading-expert', (result.reading?.score ?? 0) >= 85)
  award('listening-expert', (result.listening?.score ?? 0) >= 85)
  award(
    'writing-master',
    (result.writing?.score ?? 0) >= 85 && (result.writing?.withinRange ?? false),
  )
  award(
    'speaking-star',
    !!result.speaking &&
      result.speaking.repeatCompleted === result.speaking.repeatTotal &&
      result.speaking.cueCardWithinWindow,
  )
  award('full-mock', result.mode === 'full' && result.skills.length === 4)
  award(
    'perfect-integrity',
    result.proctor.monitoredSeconds > 0 && result.proctor.integrityScore >= 100,
  )
  award('streak-7', profile.streak.current >= 7)
  award('streak-30', profile.streak.current >= 30)

  return earned
}
