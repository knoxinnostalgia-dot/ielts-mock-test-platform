import { createContext, useContext } from 'react'

import type { CandidateProfile, Difficulty, IssuedCertificate, TestResult } from '@/types'
import type { ProfileStats } from '@/utils/profile'

export interface ProfileContextValue {
  profile: CandidateProfile
  stats: ProfileStats
  /** Difficulty actually used to select content (respects the auto-adapt toggle). */
  currentDifficulty: Difficulty
  setName: (name: string) => void
  setDifficulty: (difficulty: Difficulty) => void
  setAutoAdapt: (enabled: boolean) => void
  /** Saves name and email so the candidate can claim certificates on this device. */
  signIn: (name: string, email: string) => void
  /** Issues or refreshes a certificate record for a completed test. */
  issueCertificate: (result: TestResult, name: string, email: string) => IssuedCertificate
  /** Persists a finished test, updates streak, adapts difficulty, unlocks achievements. */
  commitResult: (result: TestResult) => string[]
  deleteResult: (resultId: string) => void
  resetProfile: () => void
  /** Achievement ids unlocked by the most recent commit, for the celebration toast. */
  recentUnlocks: string[]
  clearRecentUnlocks: () => void
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used inside <ProfileProvider>')
  return context
}
