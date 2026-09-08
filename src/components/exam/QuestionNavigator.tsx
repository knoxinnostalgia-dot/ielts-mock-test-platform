import { useState } from 'react'

import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

export interface NavigatorQuestion {
  id: string
  label: string
}

interface QuestionNavigatorProps {
  questions: NavigatorQuestion[]
  answers: Record<string, number>
  flagged: string[]
  currentIndex: number
  onNavigate: (index: number) => void
  disabled?: boolean
  className?: string
}

/** Collapsible question map with answered / flagged / unanswered states. */
export function QuestionNavigator({
  questions,
  answers,
  flagged,
  currentIndex,
  onNavigate,
  disabled = false,
  className,
}: QuestionNavigatorProps) {
  const [collapsed, setCollapsed] = useState(false)

  const answeredCount = questions.filter((question) => question.id in answers).length
  const flaggedCount = questions.filter((question) => flagged.includes(question.id)).length
  const unansweredCount = questions.length - answeredCount
  const completion = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  return (
    <nav
      aria-label="Question navigator"
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        <Icon name="list" size={16} className="text-brand-600 dark:text-brand-400" />
        <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Question Navigator
        </span>
        <span className="ml-auto text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
          {answeredCount}/{questions.length}
        </span>
        <Icon
          name="chevronDown"
          size={16}
          className={cn('text-slate-400 transition-transform', collapsed && '-rotate-90')}
        />
      </button>

      {!collapsed && (
        <div className="space-y-3 px-3 pb-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>

          <ul className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
            {questions.map((question, index) => {
              const answered = question.id in answers
              const isFlagged = flagged.includes(question.id)
              const isCurrent = index === currentIndex
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onNavigate(index)}
                    aria-current={isCurrent ? 'true' : undefined}
                    aria-label={`Question ${question.label}${answered ? ', answered' : ', unanswered'}${isFlagged ? ', flagged for review' : ''}`}
                    className={cn(
                      'relative flex h-9 w-full items-center justify-center rounded-lg border text-xs font-bold transition',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      answered
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400',
                      isCurrent && 'ring-2 ring-brand-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900',
                    )}
                  >
                    {question.label}
                    {isFlagged && (
                      <span
                        className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-white"
                        aria-hidden="true"
                      >
                        !
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          <dl className="grid grid-cols-3 gap-1.5 border-t border-slate-200 pt-2.5 text-center dark:border-slate-800">
            <div>
              <dt className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                <span className="text-emerald-500">✓</span> Answered
              </dt>
              <dd className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                {answeredCount}
              </dd>
            </div>
            <div>
              <dt className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                <span className="text-amber-500">⚠</span> Flagged
              </dt>
              <dd className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                {flaggedCount}
              </dd>
            </div>
            <div>
              <dt className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                <span className="text-slate-400">○</span> Remaining
              </dt>
              <dd className="text-sm font-bold tabular-nums text-slate-800 dark:text-slate-100">
                {unansweredCount}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </nav>
  )
}
