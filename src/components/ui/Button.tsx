import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/utils/cn'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_4px_0_0_#1a34e1] hover:bg-brand-500 active:translate-y-[3px] active:shadow-[0_1px_0_0_#1a34e1] disabled:bg-brand-600/50 disabled:shadow-none',
  secondary:
    'bg-slate-900 text-white shadow-[0_4px_0_0_#0f172a] hover:bg-slate-800 active:translate-y-[3px] active:shadow-[0_1px_0_0_#0f172a] dark:bg-slate-100 dark:text-slate-900 dark:shadow-[0_4px_0_0_#94a3b8] dark:hover:bg-white',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-800',
  outline:
    'border-2 border-b-4 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:translate-y-[2px] active:border-b-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  danger:
    'bg-rose-600 text-white shadow-[0_4px_0_0_#be123c] hover:bg-rose-500 active:translate-y-[3px] active:shadow-[0_1px_0_0_#be123c]',
  success:
    'bg-emerald-500 text-white shadow-[0_4px_0_0_#047857] hover:bg-emerald-400 active:translate-y-[3px] active:shadow-[0_1px_0_0_#047857]',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-6 text-base gap-2.5 rounded-xl',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconRight?: IconName
  loading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} />
      )}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={size === 'lg' ? 20 : 18} />}
    </button>
  )
}
