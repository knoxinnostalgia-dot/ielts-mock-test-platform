import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { evaluateAchievements } from '@/data/achievements'
import type { CandidateProfile, Difficulty, TestResult } from '@/types'
import {
  activeDifficulty,
  computeProfileStats,
  createProfile,
  nextAdaptiveDifficulty,
  normaliseStreak,
  registerPracticeDay,
} from '@/utils/profile'
import { recordingIdsFromResult } from '@/utils/scoring'
import { STORAGE_KEYS, deleteRecording, readJSON, writeJSON } from '@/utils/storage'
import { ProfileContext } from './profile'

/** Older stored profiles are merged onto defaults so new fields never read as undefined. */
function hydrateProfile(): CandidateProfile {
  const base = createProfile()
  const stored = readJSON<Partial<CandidateProfile> | null>(STORAGE_KEYS.profile, null)
  if (!stored) return base
  return {
    ...base,
    ...stored,
    streak: normaliseStreak({ ...base.streak, ...stored.streak }),
    achievements: stored.achievements ?? [],
    results: stored.results ?? [],
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CandidateProfile>(hydrateProfile)
  const [recentUnlocks, setRecentUnlocks] = useState<string[]>([])
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    writeJSON(STORAGE_KEYS.profile, profile)
  }, [profile])

  const setName = useCallback((name: string) => {
    setProfile((current) => ({ ...current, name: name.trim() || 'Candidate' }))
  }, [])

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setProfile((current) => ({ ...current, difficulty, adaptiveDifficulty: difficulty }))
  }, [])

  const setAutoAdapt = useCallback((enabled: boolean) => {
    setProfile((current) => ({ ...current, autoAdapt: enabled }))
  }, [])

  const commitResult = useCallback((result: TestResult) => {
    let unlocked: string[] = []
    setProfile((current) => {
      const results = [...current.results, result].slice(-50)
      const streak = registerPracticeDay(current.streak)
      const withStreak: CandidateProfile = { ...current, results, streak }
      unlocked = evaluateAchievements(withStreak, result)
      const now = Date.now()
      return {
        ...withStreak,
        adaptiveDifficulty: nextAdaptiveDifficulty(current.adaptiveDifficulty, results),
        achievements: [
          ...current.achievements,
          ...unlocked.map((id) => ({ id, unlockedAt: now })),
        ],
      }
    })
    setRecentUnlocks(unlocked)
    return unlocked
  }, [])

  const deleteResult = useCallback((resultId: string) => {
    setProfile((current) => {
      const target = current.results.find((item) => item.id === resultId)
      if (target) {
        recordingIdsFromResult(target).forEach((id) => {
          void deleteRecording(id)
        })
      }
      return { ...current, results: current.results.filter((item) => item.id !== resultId) }
    })
  }, [])

  const resetProfile = useCallback(() => {
    setProfile((current) => {
      current.results.forEach((result) => {
        recordingIdsFromResult(result).forEach((id) => {
          void deleteRecording(id)
        })
      })
      return createProfile()
    })
    setRecentUnlocks([])
  }, [])

  const clearRecentUnlocks = useCallback(() => setRecentUnlocks([]), [])

  const value = useMemo(
    () => ({
      profile,
      stats: computeProfileStats(profile),
      currentDifficulty: activeDifficulty(profile),
      setName,
      setDifficulty,
      setAutoAdapt,
      commitResult,
      deleteResult,
      resetProfile,
      recentUnlocks,
      clearRecentUnlocks,
    }),
    [
      profile,
      setName,
      setDifficulty,
      setAutoAdapt,
      commitResult,
      deleteResult,
      resetProfile,
      recentUnlocks,
      clearRecentUnlocks,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
