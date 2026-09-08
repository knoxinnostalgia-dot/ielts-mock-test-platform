import type { CEFRLevel } from '@/types'

interface CEFRBand {
  level: CEFRLevel
  min: number
  label: string
  description: string
  color: string
}

/** Score → CEFR bands used across the results dashboard and PDF report. */
export const CEFR_BANDS: CEFRBand[] = [
  {
    level: 'C2',
    min: 90,
    label: 'Proficient',
    description: 'Understands virtually everything heard or read with effortless precision.',
    color: '#7c3aed',
  },
  {
    level: 'C1',
    min: 80,
    label: 'Advanced',
    description: 'Expresses ideas fluently and uses language flexibly for academic purposes.',
    color: '#2563eb',
  },
  {
    level: 'B2',
    min: 70,
    label: 'Upper Intermediate',
    description: 'Handles complex text and interacts with a degree of fluency and spontaneity.',
    color: '#0d9488',
  },
  {
    level: 'B1',
    min: 60,
    label: 'Intermediate',
    description: 'Deals with most situations and produces connected text on familiar topics.',
    color: '#ca8a04',
  },
  {
    level: 'A2',
    min: 45,
    label: 'Elementary',
    description: 'Communicates in simple, routine tasks on familiar matters.',
    color: '#ea580c',
  },
  {
    level: 'A1',
    min: 0,
    label: 'Beginner',
    description: 'Understands and uses very basic everyday expressions.',
    color: '#dc2626',
  },
]

export function scoreToCEFR(score: number): CEFRLevel {
  const band = CEFR_BANDS.find((item) => score >= item.min)
  return band ? band.level : 'A1'
}

export function cefrBand(level: CEFRLevel): CEFRBand {
  return CEFR_BANDS.find((band) => band.level === level) ?? CEFR_BANDS[CEFR_BANDS.length - 1]
}

/** Numeric rank (1 = A1) so averages and comparisons stay ordered. */
export function cefrRank(level: CEFRLevel): number {
  const order: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  return order.indexOf(level) + 1
}

export function scoreTone(score: number): 'critical' | 'warning' | 'good' | 'excellent' {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'warning'
  return 'critical'
}
