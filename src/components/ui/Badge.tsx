import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  brand: 'bg-brand-500/12 text-brand-700 dark:text-brand-300',
  success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  info: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  purple: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
}

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  icon?: IconName
  className?: string
  pulse?: boolean
}

export function Badge({ children, tone = 'neutral', icon, className, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        TONES[tone],
        pulse && 'animate-pulse',
        className,
      )}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}
