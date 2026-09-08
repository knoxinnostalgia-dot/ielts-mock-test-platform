/** Formats seconds as mm:ss (or h:mm:ss past an hour). */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Wall-clock timestamp used in the integrity event log. */
export function formatTimeOfDay(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export function formatDateTime(epochMs: number): string {
  return `${formatDate(epochMs)} · ${new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  if (safe < 60) return `${safe}s`
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`
}

/** Local (not UTC) yyyy-mm-dd key — streaks follow the candidate's calendar. */
export function toDayKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dayKeyToDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

export function daysBetween(fromKey: string, toKey: string): number {
  const from = dayKeyToDate(fromKey).getTime()
  const to = dayKeyToDate(toKey).getTime()
  return Math.round((to - from) / 86_400_000)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}
