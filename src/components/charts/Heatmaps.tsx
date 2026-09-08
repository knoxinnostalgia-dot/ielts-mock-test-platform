import type { SkillId, TestResult } from '@/types'
import { cn } from '@/utils/cn'
import { SKILL_LABELS } from '@/utils/constants'
import { addDays, formatDate, toDayKey } from '@/utils/time'

/** Colour ramp shared by both heatmaps. */
function rampColor(value: number): string {
  if (value >= 85) return 'bg-emerald-500'
  if (value >= 70) return 'bg-emerald-400'
  if (value >= 55) return 'bg-amber-400'
  if (value >= 40) return 'bg-orange-400'
  return 'bg-rose-500'
}

interface CalendarHeatmapProps {
  /** yyyy-mm-dd keys of days with practice activity. */
  days: string[]
  weeks?: number
  className?: string
}

export function CalendarHeatmap({ days, weeks = 18, className }: CalendarHeatmapProps) {
  const active = new Set(days)
  const today = new Date()
  // Anchor the grid to the most recent Sunday so columns are whole weeks.
  const end = addDays(today, 6 - today.getDay())
  const start = addDays(end, -(weeks * 7 - 1))

  const columns: { key: string; inFuture: boolean; active: boolean }[][] = []
  for (let week = 0; week < weeks; week += 1) {
    const column: { key: string; inFuture: boolean; active: boolean }[] = []
    for (let day = 0; day < 7; day += 1) {
      const date = addDays(start, week * 7 + day)
      const key = toDayKey(date)
      column.push({
        key,
        inFuture: date.getTime() > today.getTime(),
        active: active.has(key),
      })
    }
    columns.push(column)
  }

  return (
    <div className={cn('flex gap-1 overflow-x-auto scrollbar-thin pb-1', className)}>
      <div className="mr-1 flex flex-col justify-between py-[1px] text-[9px] text-slate-400">
        <span>Mon</span>
        <span>Wed</span>
        <span>Fri</span>
      </div>
      {columns.map((column, index) => (
        <div key={index} className="flex flex-col gap-1">
          {column.map((cell) => (
            <span
              key={cell.key}
              title={`${formatDate(new Date(cell.key).getTime())}${cell.active ? ' — practised' : ''}`}
              className={cn(
                'h-3 w-3 rounded-[3px] transition-colors',
                cell.inFuture
                  ? 'bg-transparent'
                  : cell.active
                    ? 'bg-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-800',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface PerformanceHeatmapProps {
  results: TestResult[]
  className?: string
}

const SKILL_ORDER: SkillId[] = ['listening', 'reading', 'writing', 'speaking']

/** Test attempts across the x axis, skills down the y axis. */
export function PerformanceHeatmap({ results, className }: PerformanceHeatmapProps) {
  const recent = results.slice(-10)

  if (recent.length === 0) {
    return (
      <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)}>
        Complete a test to build your performance heatmap.
      </p>
    )
  }

  return (
    <div className={cn('overflow-x-auto scrollbar-thin', className)}>
      <table className="w-full border-separate border-spacing-1 text-left">
        <thead>
          <tr>
            <th className="w-24 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Skill
            </th>
            {recent.map((result, index) => (
              <th
                key={result.id}
                className="min-w-9 text-center text-[11px] font-medium text-slate-400"
                title={formatDate(result.completedAt)}
              >
                {results.length - recent.length + index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SKILL_ORDER.map((skill) => (
            <tr key={skill}>
              <td className="pr-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                {SKILL_LABELS[skill]}
              </td>
              {recent.map((result) => {
                const score = result[skill]?.score ?? null
                return (
                  <td key={`${result.id}-${skill}`}>
                    <div
                      title={
                        score === null
                          ? `${SKILL_LABELS[skill]} — not attempted`
                          : `${SKILL_LABELS[skill]} — ${score}% on ${formatDate(result.completedAt)}`
                      }
                      className={cn(
                        'flex h-9 items-center justify-center rounded-md text-[11px] font-bold text-white transition',
                        score === null
                          ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                          : rampColor(score),
                      )}
                    >
                      {score === null ? '—' : score}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
