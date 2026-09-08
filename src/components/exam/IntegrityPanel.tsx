import { useState, type RefObject } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import type { IntegrityEvent, ProctorSummary } from '@/types'
import { cn } from '@/utils/cn'
import { INTEGRITY_EVENT_LABELS } from '@/utils/constants'
import { formatTimeOfDay } from '@/utils/time'
import type { FaceMonitorController } from '@/hooks/useFaceMonitor'

interface IntegrityPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>
  monitor: FaceMonitorController
  proctor: ProctorSummary
  className?: string
}

const SEVERITY_COLOR: Record<IntegrityEvent['severity'], string> = {
  info: 'text-slate-500 dark:text-slate-400',
  warning: 'text-amber-600 dark:text-amber-400',
  critical: 'text-rose-600 dark:text-rose-400',
}

/**
 * Live proctoring panel. The camera stream is analysed in the browser and never
 * leaves the device, and no audio is captured at any point.
 */
export function IntegrityPanel({ videoRef, monitor, proctor, className }: IntegrityPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showLog, setShowLog] = useState(false)

  const loading = monitor.status === 'requesting' || monitor.status === 'loading-model'
  const denied = monitor.status === 'denied' || monitor.status === 'unavailable'
  const multiple = monitor.faceCount > 1

  const recentEvents = [...proctor.events].reverse().slice(0, 12)

  return (
    <aside
      className={cn(
        'w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85',
        className,
      )}
      aria-label="Exam integrity monitor"
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
        aria-expanded={!collapsed}
      >
        <Icon name="shield" size={16} className="text-brand-600 dark:text-brand-400" />
        <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Exam Integrity
        </span>
        <span
          className={cn(
            'ml-auto text-sm font-bold tabular-nums',
            proctor.integrityScore >= 85
              ? 'text-emerald-600 dark:text-emerald-400'
              : proctor.integrityScore >= 60
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400',
          )}
        >
          {proctor.integrityScore}%
        </span>
        <Icon
          name="chevronDown"
          size={16}
          className={cn('text-slate-400 transition-transform', collapsed && '-rotate-90')}
        />
      </button>

      {!collapsed && (
        <div className="space-y-3 px-3 pb-3">
          <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-video">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-full w-full scale-x-[-1] object-cover"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-xs font-medium text-slate-200">
                {monitor.status === 'requesting' ? 'Requesting camera…' : 'Loading face analysis…'}
              </div>
            )}
            {denied && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-900/90 px-3 text-center">
                <Icon name="cameraOff" size={22} className="text-rose-400" />
                <p className="text-[11px] font-medium text-slate-300">Camera unavailable</p>
              </div>
            )}
            {!denied && !loading && (
              <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2 py-1">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    monitor.facePresent ? 'bg-emerald-400' : 'bg-rose-400',
                  )}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white">
                  {monitor.analysisAvailable ? 'Monitoring' : 'Preview'}
                </span>
              </div>
            )}
            <p className="absolute bottom-2 right-2 rounded bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-300">
              Video only · no audio
            </p>
          </div>

          {monitor.error && (
            <p className="rounded-lg bg-amber-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              {monitor.error}
            </p>
          )}

          <dl className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500 dark:text-slate-400">Face Status</dt>
              <dd>
                <Badge tone={monitor.facePresent ? 'success' : 'danger'}>
                  {monitor.facePresent ? 'Detected' : 'Not Detected'}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500 dark:text-slate-400">People Detected</dt>
              <dd>
                <Badge tone={multiple ? 'danger' : 'neutral'} icon={multiple ? 'users' : undefined}>
                  {multiple ? `Multiple (${monitor.faceCount})` : monitor.faceCount === 1 ? '1' : '0'}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500 dark:text-slate-400">Focus Violations</dt>
              <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                {proctor.focusViolations}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500 dark:text-slate-400">Tab Switches</dt>
              <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                {proctor.tabSwitches}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500 dark:text-slate-400">Fullscreen Exits</dt>
              <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                {proctor.fullscreenExits}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => setShowLog((value) => !value)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-expanded={showLog}
          >
            Integrity event log ({proctor.events.length})
            <Icon name="chevronDown" size={14} className={cn(!showLog && '-rotate-90')} />
          </button>

          {showLog && (
            <ul className="max-h-44 space-y-1 overflow-y-auto scrollbar-thin pr-1 text-[11px]">
              {recentEvents.length === 0 && (
                <li className="py-2 text-center text-slate-400">No events recorded</li>
              )}
              {recentEvents.map((event) => (
                <li key={event.id} className="flex items-start gap-2 leading-snug">
                  <span className="shrink-0 font-mono tabular-nums text-slate-400">
                    {formatTimeOfDay(event.at)}
                  </span>
                  <span className={cn('font-medium', SEVERITY_COLOR[event.severity])}>
                    {INTEGRITY_EVENT_LABELS[event.type]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  )
}
