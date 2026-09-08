import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-[3px] border-brand-500/25 border-t-brand-600',
        className,
      )}
      style={{ width: size, height: size }}
    />
  )
}

export function LoadingScreen({ message = 'Preparing your test…' }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
      <Spinner size={36} />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

interface EmptyStateProps {
  icon?: IconName
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon = 'sparkles', title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action}
    </div>
  )
}

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const ALERT_STYLES: Record<AlertTone, { wrapper: string; icon: IconName }> = {
  info: {
    wrapper: 'border-sky-300/70 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100',
    icon: 'info',
  },
  success: {
    wrapper:
      'border-emerald-300/70 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
    icon: 'check',
  },
  warning: {
    wrapper:
      'border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    icon: 'alert',
  },
  danger: {
    wrapper: 'border-rose-300/70 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100',
    icon: 'alert',
  },
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  className?: string
}) {
  const style = ALERT_STYLES[tone]
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', style.wrapper, className)}
    >
      <Icon name={style.icon} size={18} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'leading-relaxed')}>{children}</div>}
      </div>
    </div>
  )
}
