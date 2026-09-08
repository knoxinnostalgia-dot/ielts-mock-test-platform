import { Icon } from '@/components/ui/Icon'
import { useRecordingUrl } from '@/hooks/useRecordingUrl'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/time'

interface RecordingPlaybackProps {
  recordingId: string | null | undefined
  durationSeconds?: number
  label?: string
  className?: string
}

/** Plays back a recording stored in the local blob store. */
export function RecordingPlayback({
  recordingId,
  durationSeconds,
  label = 'Your recording',
  className,
}: RecordingPlaybackProps) {
  const url = useRecordingUrl(recordingId)

  if (!recordingId) return null

  return (
    <div
      className={cn(
        'rounded-xl border border-emerald-300/60 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/25',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon name="check" size={15} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">{label}</span>
        {typeof durationSeconds === 'number' && (
          <span className="ml-auto text-xs font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
            {formatDuration(durationSeconds)}
          </span>
        )}
      </div>
      {url ? (
        <audio controls src={url} className="h-9 w-full" preload="metadata">
          <track kind="captions" />
        </audio>
      ) : (
        <p className="text-xs text-emerald-700 dark:text-emerald-300">Loading recording…</p>
      )}
    </div>
  )
}
