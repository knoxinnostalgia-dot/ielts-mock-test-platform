import { cn } from '@/utils/cn'

interface ProgressBarProps {
  /** 0-100 */
  value: number
  label?: string
  hint?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const BAR_HEIGHT = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }

export function ProgressBar({
  value,
  label,
  hint,
  color = '#3366ff',
  size = 'md',
  showValue = true,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && (
            <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              {label}
            </span>
          )}
          {showValue && (
            <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          'w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
          BAR_HEIGHT[size],
        )}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${clamped}%`,
            backgroundImage: `linear-gradient(90deg, ${color}, ${color}cc)`,
          }}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

interface ProgressRingProps {
  value: number
  size?: number
  thickness?: number
  color?: string
  label?: string
  caption?: string
  className?: string
}

export function ProgressRing({
  value,
  size = 132,
  thickness = 11,
  color = '#3366ff',
  label,
  caption,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${Math.round(clamped)} percent`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50"
          style={{ fontSize: size / 4.6 }}
        >
          {label ?? `${Math.round(clamped)}%`}
        </span>
        {caption && (
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {caption}
          </span>
        )}
      </div>
    </div>
  )
}
