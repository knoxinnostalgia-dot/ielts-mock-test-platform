import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  children: ReactNode
}

export function Card({ glass = false, className, children, ...rest }: CardProps) {
  return (
    <div className={cn(glass ? 'glass-card' : 'surface-card', className)} {...rest}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: IconName
  accent?: string
  action?: ReactNode
  className?: string
}

export function CardHeader({
  title,
  subtitle,
  icon,
  accent,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 pb-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: accent ? `${accent}1f` : undefined,
              color: accent,
            }}
          >
            <Icon name={icon} size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 pb-5', className)} {...rest}>
      {children}
    </div>
  )
}
