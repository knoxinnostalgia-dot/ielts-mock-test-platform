import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { useAudioClip } from '@/hooks/useAudioClip'
import { cn } from '@/utils/cn'
import { MAX_AUDIO_PLAYS, PLAYBACK_LIMIT_MESSAGE } from '@/utils/constants'
import { formatClock } from '@/utils/time'

interface AudioPlayerProps {
  clipId: string
  title: string
  speakerLabel?: string
  src?: string
  transcript: string
  estimatedSeconds: number
  playsUsed: number
  disabled?: boolean
  compact?: boolean
  onPlayStart: (clipId: string) => void
  onPlayEnd?: (clipId: string) => void
}

/**
 * Exam audio player with a hard two-play limit.
 *
 * Pause and resume are always available, but once both plays are consumed the
 * play control is disabled permanently for the rest of the session.
 */
export function AudioPlayer({
  clipId,
  title,
  speakerLabel,
  src,
  transcript,
  estimatedSeconds,
  playsUsed,
  disabled = false,
  compact = false,
  onPlayStart,
  onPlayEnd,
}: AudioPlayerProps) {
  const clip = useAudioClip({
    clipId,
    src,
    transcript,
    estimatedSeconds,
    playsUsed,
    onPlayStart,
    onPlayEnd,
  })

  const playing = clip.status === 'playing'
  const blocked = clip.limitReached && !playing
  const canInteract = !disabled && (playing || clip.canStart || clip.status === 'paused')

  const handleToggle = () => {
    if (playing) clip.pause()
    else clip.play()
  }

  return (
    <div
      className={cn(
        'rounded-2xl border transition-colors',
        blocked
          ? 'border-rose-300/70 bg-rose-50/60 dark:border-rose-900/60 dark:bg-rose-950/25'
          : 'border-slate-200 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60',
        compact ? 'p-3' : 'p-4 sm:p-5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>
          {speakerLabel && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{speakerLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {clip.mode === 'speech' && (
            <Badge tone="neutral" icon="volume">
              Synthesised
            </Badge>
          )}
          <Badge
            tone={clip.playsRemaining === 0 ? 'danger' : clip.playsRemaining === 1 ? 'warning' : 'success'}
          >
            {clip.playsUsed}/{MAX_AUDIO_PLAYS} plays used
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={!canInteract}
          aria-label={playing ? 'Pause recording' : 'Play recording'}
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
            canInteract
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 hover:bg-brand-700 active:scale-95'
              : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600',
          )}
        >
          {clip.status === 'loading' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Icon name={playing ? 'pause' : 'play'} size={20} filled={!playing} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clip.progress * 100)}
            aria-label="Playback position"
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-200',
                blocked ? 'bg-rose-400' : 'bg-brand-600',
              )}
              style={{ width: `${clip.progress * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
            <span>{formatClock(clip.position)}</span>
            <span>{formatClock(clip.duration)}</span>
          </div>
        </div>
      </div>

      {blocked && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300"
        >
          <Icon name="lock" size={14} />
          {PLAYBACK_LIMIT_MESSAGE}
        </p>
      )}

      {clip.error && (
        <p role="alert" className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
          {clip.error}
        </p>
      )}

      {!blocked && clip.playsRemaining === 1 && clip.status !== 'loading' && (
        <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
          This is your final play. The recording cannot be started again afterwards.
        </p>
      )}
    </div>
  )
}
