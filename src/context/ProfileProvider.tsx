import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { evaluateAchievements } from '@/data/achievements'
import type { CandidateProfile, Difficulty, IssuedCertificate, TestResult } from '@/types'
import { createId } from '@/utils/id'
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
    email: stored.email ?? '',
    signedInAt: stored.signedInAt ?? null,
    certificates: stored.certificates ?? [],
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

  const signIn = useCallback((name: string, email: string) => {
    const trimmedName = name.trim() || 'Candidate'
    const trimmedEmail = email.trim().toLowerCase()
    setProfile((current) => ({
      ...current,
      name: trimmedName,
      email: trimmedEmail,
      signedInAt: Date.now(),
    }))
  }, [])

  const issueCertificate = useCallback(
    (result: TestResult, name: string, email: string): IssuedCertificate => {
      const trimmedName = name.trim() || result.candidateName
      const trimmedEmail = email.trim().toLowerCase()
      let issued: IssuedCertificate = {
        id: createId('cert'),
        resultId: result.id,
        candidateName: trimmedName,
        email: trimmedEmail,
        issuedAt: Date.now(),
        overallScore: result.overallScore,
        cefr: result.cefr,
        mode: result.mode,
        skills: result.skills,
      }
      setProfile((current) => {
        const existing = current.certificates.find((item) => item.resultId === result.id)
        issued = existing
          ? { ...existing, candidateName: trimmedName, email: trimmedEmail, issuedAt: Date.now() }
          : issued
        const certificates = existing
          ? current.certificates.map((item) => (item.resultId === result.id ? issued : item))
          : [...current.certificates, issued]
        return {
          ...current,
          name: trimmedName,
          email: trimmedEmail,
          signedInAt: current.signedInAt ?? Date.now(),
          certificates,
        }
      })
      return issued
    },
    [],
  )

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
      return {
        ...current,
        results: current.results.filter((item) => item.id !== resultId),
        certificates: current.certificates.filter((item) => item.resultId !== resultId),
      }
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
      signIn,
      issueCertificate,
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
      signIn,
      issueCertificate,
      commitResult,
      deleteResult,
      resetProfile,
      recentUnlocks,
      clearRecentUnlocks,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
