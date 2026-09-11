import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { ExamActionBar } from '@/components/exam/ExamActionBar'
import { ExamShell } from '@/components/exam/ExamShell'
import { IntegrityPanel } from '@/components/exam/IntegrityPanel'
import { RichTextEditor } from '@/components/exam/RichTextEditor'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { Alert } from '@/components/ui/Feedback'
import { WRITING_CATEGORY_BLURB, WRITING_CATEGORY_LABELS, getWritingPrompt } from '@/data/writingPrompts'
import { useSession } from '@/context/session'
import { useExamRuntime } from '@/hooks/useExamRuntime'
import { cn } from '@/utils/cn'
import { AUTOSAVE_DEBOUNCE_MS } from '@/utils/constants'
import { htmlToPlainText } from '@/utils/html'
import { analyzeText } from '@/utils/text'
import { formatTimeOfDay } from '@/utils/time'

const BRIEFING_POINTS = [
  'One essay task drawn from the opinion, argumentative, expository or descriptive category.',
  'Your response must fall inside the word range shown with the prompt.',
  'The live word counter turns green once you are inside the range and red when you are outside it.',
  'Drafts autosave continuously — closing the tab will not lose your work.',
  'The section submits itself automatically when the 20 minute limit is reached.',
]

export default function WritingTest() {
  const { session, setWritingText } = useSession()
  const runtime = useExamRuntime('writing')

  const state = session?.writing ?? null
  const prompt = useMemo(() => getWritingPrompt(state?.promptId ?? ''), [state?.promptId])
  const locked = runtime.locked

  const [draft, setDraft] = useState(state?.text ?? '')
  const [savedAt, setSavedAt] = useState<number | null>(state?.lastSavedAt ?? null)
  const hydratedFor = useRef<string | null>(null)

  // Adopt the stored draft once per section (covers refresh-restored sessions).
  useEffect(() => {
    if (!state) return
    if (hydratedFor.current === state.promptId) return
    hydratedFor.current = state.promptId
    setDraft(state.text)
    setSavedAt(state.lastSavedAt)
  }, [state])

  useEffect(() => {
    if (locked) return
    if (draft === (state?.text ?? '')) return
    const timer = window.setTimeout(() => {
      setWritingText(draft)
      setSavedAt(Date.now())
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [draft, locked, setWritingText, state?.text])

  const stats = useMemo(() => analyzeText(htmlToPlainText(draft)), [draft])
  const { wordCount } = stats
  const under = wordCount < prompt.minWords
  const over = wordCount > prompt.maxWords
  const withinRange = !under && !over && wordCount > 0

  const rangeProgress = Math.min(100, (wordCount / prompt.maxWords) * 100)
  const minMarker = (prompt.minWords / prompt.maxWords) * 100

  const handleChange = useCallback((html: string) => setDraft(html), [])

  if (!session) return <Navigate to="/" replace />

  const statusTone = withinRange ? 'success' : wordCount === 0 ? 'neutral' : 'danger'
  const statusMessage = withinRange
    ? 'Word count is within the required range'
    : wordCount === 0
      ? 'Start writing to see live validation'
      : under
        ? `${prompt.minWords - wordCount} more word${prompt.minWords - wordCount === 1 ? '' : 's'} needed`
        : `${wordCount - prompt.maxWords} word${wordCount - prompt.maxWords === 1 ? '' : 's'} over the maximum`

  return (
    <ExamShell
      skill="writing"
      runtime={runtime}
      briefingTitle="Writing Section"
      briefingSubtitle={`${WRITING_CATEGORY_LABELS[prompt.category]} · ${prompt.minWords}–${prompt.maxWords} words · 20 minutes`}
      briefingPoints={BRIEFING_POINTS}
      submitSummary={
        <Alert tone={withinRange ? 'success' : 'warning'}>
          {withinRange
            ? `${wordCount} words — inside the ${prompt.minWords}–${prompt.maxWords} range.`
            : `Your response is ${wordCount} words, outside the required ${prompt.minWords}–${prompt.maxWords} range. Submitting now will reduce your task-compliance score.`}
        </Alert>
      }
      actionBar={
        <ExamActionBar
          hint={statusMessage}
          primaryLabel="Submit"
          primaryDisabled={locked || wordCount === 0}
          onPrimary={runtime.requestSubmit}
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)_18rem]">
        <section
          className="surface-card flex max-h-[calc(100vh-7.5rem)] flex-col overflow-hidden"
          aria-label="Essay prompt"
        >
          <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <Badge tone="warning" icon="pen">
              {WRITING_CATEGORY_LABELS[prompt.category]}
            </Badge>
            <h2 className="mt-2.5 text-lg font-bold text-slate-900 dark:text-slate-50">
              {prompt.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {WRITING_CATEGORY_BLURB[prompt.category]}
            </p>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto scrollbar-thin px-5 py-4">
            <p className="rounded-xl bg-slate-50 p-4 font-serif text-[15px] leading-7 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100">
              {prompt.prompt}
            </p>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Instructions
              </h3>
              <ul className="mt-2 space-y-2">
                {prompt.instructions.map((instruction) => (
                  <li
                    key={instruction}
                    className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <Icon name="check" size={15} className="mt-0.5 text-emerald-500" />
                    <span className="leading-relaxed">{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Suggested structure
              </h3>
              <ol className="mt-2 space-y-1.5">
                {prompt.suggestedStructure.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <strong className="font-semibold">Word limit:</strong> {prompt.minWords}–
              {prompt.maxWords} words. Responses outside this range lose task-compliance marks.
            </div>
          </div>
        </section>

        <section
          className="surface-card flex max-h-[calc(100vh-7.5rem)] flex-col overflow-hidden"
          aria-label="Response editor"
        >
          <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-2xl font-bold tabular-nums transition-colors',
                  withinRange
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : wordCount === 0
                      ? 'text-slate-400'
                      : 'text-rose-600 dark:text-rose-400',
                )}
              >
                {wordCount}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                / {prompt.minWords}–{prompt.maxWords} words
              </span>
            </div>

            <Badge tone={statusTone} icon={withinRange ? 'check' : wordCount === 0 ? 'info' : 'alert'}>
              {statusMessage}
            </Badge>

            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Icon name="check" size={13} className={savedAt ? 'text-emerald-500' : 'text-slate-300'} />
              {savedAt ? `Draft saved at ${formatTimeOfDay(savedAt)}` : 'Draft not saved yet'}
            </span>
          </header>

          <div className="px-4 pt-3">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={cn(
                  'h-full rounded-full transition-[width,background-color] duration-300',
                  withinRange ? 'bg-emerald-500' : wordCount === 0 ? 'bg-slate-300' : 'bg-rose-500',
                )}
                style={{ width: `${rangeProgress}%` }}
              />
              <span
                className="absolute top-0 h-full w-0.5 bg-slate-500/70"
                style={{ left: `${minMarker}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
              <span>0</span>
              <span>min {prompt.minWords}</span>
              <span>max {prompt.maxWords}</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 p-4">
            <RichTextEditor
              value={draft}
              onChange={handleChange}
              disabled={locked}
              className="h-full"
            />
          </div>

          <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {stats.sentenceCount} sentences · {stats.paragraphCount} paragraphs
            </span>
          </footer>
        </section>

        <div className="space-y-3 lg:col-span-2 xl:col-span-1">
          <IntegrityPanel
            videoRef={runtime.videoRef}
            monitor={runtime.monitor}
            proctor={session.proctor}
          />
          <div className="surface-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Live analysis
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                { label: 'Words', value: stats.wordCount },
                { label: 'Sentences', value: stats.sentenceCount },
                { label: 'Paragraphs', value: stats.paragraphCount },
                { label: 'Avg sentence', value: `${stats.averageSentenceLength.toFixed(1)} words` },
                { label: 'Unique words', value: `${Math.round(stats.uniqueWordRatio * 100)}%` },
                { label: 'Linking words', value: stats.connectiveCount },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">{row.label}</dt>
                  <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </ExamShell>
  )
}
