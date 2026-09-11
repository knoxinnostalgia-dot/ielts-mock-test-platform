import { Button } from '@/components/ui/Button'

interface ExamActionBarProps {
  onBack?: () => void
  backDisabled?: boolean
  onPrimary: () => void
  primaryLabel: string
  primaryDisabled?: boolean
  primaryVariant?: 'primary' | 'success'
  hint?: string
}

/** Sticky Duolingo-style check/continue bar used on every exam screen. */
export function ExamActionBar({
  onBack,
  backDisabled,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  primaryVariant = 'success',
  hint,
}: ExamActionBarProps) {
  return (
    <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-5">
      {onBack ? (
        <Button variant="outline" icon="chevronLeft" disabled={backDisabled} onClick={onBack}>
          Previous
        </Button>
      ) : null}
      {hint ? (
        <p className="hidden min-w-0 flex-1 truncate text-xs font-semibold text-slate-400 sm:block">
          {hint}
        </p>
      ) : (
        <span className="hidden flex-1 sm:block" />
      )}
      <Button
        className="min-w-[10rem] flex-1 sm:flex-none sm:min-w-[16rem]"
        size="lg"
        variant={primaryVariant}
        disabled={primaryDisabled}
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
    </div>
  )
}
