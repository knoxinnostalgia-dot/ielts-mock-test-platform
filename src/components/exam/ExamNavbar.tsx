import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useTheme } from '@/context/theme'
import type { SkillId } from '@/types'
import { cn } from '@/utils/cn'
import { SKILL_ACCENTS, SKILL_LABELS } from '@/utils/constants'
import { formatClock } from '@/utils/time'

interface ExamNavbarProps {
  skill: SkillId
  secondsRemaining: number
  overallPercent: number
  sessionStartedAt: number
  timerRunning: boolean
  onExit: () => void
}

/** Fixed exam header. Stays visible on every test screen, on every breakpoint. */
export function ExamNavbar({
  skill,
  secondsRemaining,
  overallPercent,
  sessionStartedAt,
  timerRunning,
  onExit,
}: ExamNavbarProps) {
  const { theme, toggleTheme } = useTheme()
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - sessionStartedAt) / 1000))

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - sessionStartedAt) / 1000))
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [sessionStartedAt])

  const critical = secondsRemaining <= 60
  const low = secondsRemaining <= 180

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-3 sm:gap-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Icon name="target" size={19} />
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">IELTS Mock Test</p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Assessment Platform
            </p>
          </div>
        </div>

        <span className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 md:block" />

        <div className="flex min-w-0 items-center gap-2">
          <span
            className="hidden h-2.5 w-2.5 shrink-0 rounded-full md:block"
            style={{ backgroundColor: SKILL_ACCENTS[skill] }}
          />
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
            {SKILL_LABELS[skill]} Section
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 dark:bg-slate-800/80 lg:flex">
            <Icon name="clock" size={15} className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Elapsed</span>
            <span className="text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {formatClock(elapsed)}
            </span>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-3.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 lg:w-40">
              <div
                className="h-full rounded-full bg-brand-600 transition-[width] duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              {overallPercent}%
            </span>
          </div>

          <Badge
            tone={critical ? 'danger' : low ? 'warning' : 'brand'}
            icon="clock"
            pulse={critical && timerRunning}
            className={cn('tabular-nums', critical && 'px-3 py-1.5 text-sm')}
          >
            {formatClock(secondsRemaining)}
          </Badge>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:block"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          </button>

          <Button variant="danger" size="sm" icon="close" onClick={onExit}>
            <span className="hidden sm:inline">Exit Test</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
