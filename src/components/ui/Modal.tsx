import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/utils/cn'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  title: string
  description?: ReactNode
  onClose?: () => void
  children?: ReactNode
  footer?: ReactNode
  tone?: 'default' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  /** Hides the close affordances for modals that demand an explicit choice. */
  dismissible?: boolean
}

const TONE_RING: Record<NonNullable<ModalProps['tone']>, string> = {
  default: 'text-brand-600 bg-brand-500/10',
  danger: 'text-rose-600 bg-rose-500/10',
  warning: 'text-amber-600 bg-amber-500/10',
}

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  tone = 'default',
  size = 'md',
  dismissible = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panelRef.current)?.focus()
    }, 20)

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.preventDefault()
        onClose?.()
        return
      }
      if (event.key !== 'Tab') return
      const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open, onClose, dismissible])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative w-full animate-scale-in rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl',
          'dark:border-slate-800 dark:bg-slate-900',
          SIZES[size],
        )}
      >
        {dismissible && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon name="close" size={18} />
          </button>
        )}

        <div className="flex items-start gap-4">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              TONE_RING[tone],
            )}
          >
            <Icon name={tone === 'default' ? 'info' : 'alert'} size={22} />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
            {description && (
              <div className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {description}
              </div>
            )}
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
