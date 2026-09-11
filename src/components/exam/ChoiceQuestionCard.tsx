import { useEffect, type ReactNode } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import type { Question } from '@/types'
import { cn } from '@/utils/cn'
import { QUESTION_TYPE_LABELS } from '@/utils/constants'

interface ChoiceQuestionCardProps {
  question: Question
  index: number
  total: number
  selected: number | undefined
  flagged: boolean
  disabled?: boolean
  context?: ReactNode
  onSelect: (optionIndex: number) => void
  onToggleFlag: () => void
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function ChoiceQuestionCard({
  question,
  index,
  total,
  selected,
  flagged,
  disabled = false,
  context,
  onSelect,
  onToggleFlag,
}: ChoiceQuestionCardProps) {
  useEffect(() => {
    if (disabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const number = Number(event.key)
      if (number >= 1 && number <= question.options.length) {
        event.preventDefault()
        onSelect(number - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [disabled, onSelect, question.options.length])

  return (
    <div className="animate-fade-in space-y-4" key={question.id}>
      {question.groupLabel && (
        <p className="rounded-xl bg-brand-500/8 px-4 py-2.5 text-sm font-medium text-brand-800 dark:bg-brand-500/12 dark:text-brand-200">
          {question.groupLabel}
        </p>
      )}

      {context}

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="brand">
          Question {index + 1} of {total}
        </Badge>
        <Badge tone="neutral">{QUESTION_TYPE_LABELS[question.type]}</Badge>
        <button
          type="button"
          onClick={onToggleFlag}
          disabled={disabled}
          aria-pressed={flagged}
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50',
            flagged
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
          )}
        >
          <Icon name="flag" size={14} />
          {flagged ? 'Flagged for review' : 'Flag for review'}
        </button>
      </div>

      <p className="text-lg font-bold leading-relaxed text-slate-900 dark:text-slate-50">
        {question.prompt}
      </p>

      <fieldset disabled={disabled} className="space-y-2.5">
        <legend className="sr-only">{question.prompt}</legend>
        {question.options.map((option, optionIndex) => {
          const active = selected === optionIndex
          return (
            <label
              key={option}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3.5 transition-all',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500',
                active
                  ? 'border-brand-500 bg-brand-500/10 shadow-[0_4px_0_0_#1a34e1]'
                  : 'border-b-4 border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-600',
                disabled && 'cursor-not-allowed opacity-70 hover:translate-y-0',
              )}
            >
              <input
                type="radio"
                name={question.id}
                value={optionIndex}
                checked={active}
                onChange={() => onSelect(optionIndex)}
                className="sr-only"
              />
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black',
                  active
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
                )}
                aria-hidden="true"
              >
                {optionIndex + 1}
              </span>
              <span
                className={cn(
                  'pt-1 text-sm leading-relaxed',
                  active
                    ? 'font-semibold text-slate-900 dark:text-slate-50'
                    : 'text-slate-700 dark:text-slate-300',
                )}
              >
                {option}
              </span>
              <span className="ml-auto hidden pt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:block">
                {OPTION_LETTERS[optionIndex]}
              </span>
            </label>
          )
        })}
      </fieldset>
      <p className="text-[11px] font-medium text-slate-400">Press 1–{question.options.length} to answer</p>
    </div>
  )
}
