import { useMemo } from 'react'

import { CalendarHeatmap } from '@/components/charts/Heatmaps'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Icon, type IconName } from '@/components/ui/Icon'
import { ProgressBar } from '@/components/ui/Progress'
import { ACHIEVEMENTS } from '@/data/achievements'
import { useProfile } from '@/context/profile'
import type { AchievementDefinition } from '@/types'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/time'

const TIER_STYLES: Record<AchievementDefinition['tier'], { ring: string; chip: string; label: string }> = {
  bronze: {
    ring: 'from-amber-600/25 to-amber-700/10 text-amber-700 dark:text-amber-400',
    chip: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
    label: 'Bronze',
  },
  silver: {
    ring: 'from-slate-400/25 to-slate-500/10 text-slate-600 dark:text-slate-300',
    chip: 'bg-slate-500/12 text-slate-600 dark:text-slate-300',
    label: 'Silver',
  },
  gold: {
    ring: 'from-yellow-400/30 to-amber-500/10 text-yellow-600 dark:text-yellow-400',
    chip: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
    label: 'Gold',
  },
  platinum: {
    ring: 'from-violet-400/30 to-fuchsia-500/10 text-violet-600 dark:text-violet-400',
    chip: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    label: 'Platinum',
  },
}

export default function Achievements() {
  const { profile } = useProfile()

  const unlockedMap = useMemo(
    () => new Map(profile.achievements.map((item) => [item.id, item.unlockedAt])),
    [profile.achievements],
  )

  const unlockedCount = ACHIEVEMENTS.filter((item) => unlockedMap.has(item.id)).length
  const completion = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Achievements
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Milestones unlock automatically as you practise.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader
            title="Collection progress"
            subtitle={`${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`}
            icon="trophy"
            accent="#f59e0b"
          />
          <CardBody>
            <ProgressBar value={completion} label="Completion" color="#f59e0b" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Practice streak" icon="flame" accent="#f97316" />
          <CardBody>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                  {profile.streak.current}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                  {profile.streak.longest}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Longest</p>
              </div>
            </div>
            <CalendarHeatmap className="mt-4" days={profile.streak.history} weeks={12} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((achievement) => {
          const unlockedAt = unlockedMap.get(achievement.id)
          const unlocked = unlockedAt !== undefined
          const tier = TIER_STYLES[achievement.tier]
          return (
            <Card
              key={achievement.id}
              className={cn(
                'p-5 text-center transition hover:-translate-y-1 hover:shadow-md',
                unlocked ? 'animate-pop' : 'opacity-55 grayscale',
              )}
            >
              <span
                className={cn(
                  'mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br shadow-[0_6px_0_0_rgb(15_23_42_/_0.12)]',
                  tier.ring,
                )}
              >
                <Icon name={achievement.icon as IconName} size={32} />
              </span>
              <p className="mt-4 text-sm font-black text-slate-900 dark:text-slate-50">
                {achievement.title}
              </p>
              <span
                className={cn(
                  'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  tier.chip,
                )}
              >
                {tier.label}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {achievement.description}
              </p>
              <div className="mt-3 flex justify-center">
                {unlocked ? (
                  <Badge tone="success" icon="check">
                    Unlocked {formatDate(unlockedAt)}
                  </Badge>
                ) : (
                  <Badge tone="neutral" icon="lock">
                    Locked
                  </Badge>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
