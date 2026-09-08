import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { ChoiceQuestionCard } from '@/components/exam/ChoiceQuestionCard'
import { ExamShell } from '@/components/exam/ExamShell'
import { IntegrityPanel } from '@/components/exam/IntegrityPanel'
import { QuestionNavigator } from '@/components/exam/QuestionNavigator'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Alert } from '@/components/ui/Feedback'
import { useSession } from '@/context/session'
import { useExamRuntime } from '@/hooks/useExamRuntime'
import { getReadingPassage } from '@/data/readingPassages'
import { cn } from '@/utils/cn'

const BRIEFING_POINTS = [
  'One academic passage with 13 questions covering all five IELTS reading task types.',
  'Move freely between questions with Next and Previous, or jump using the question navigator.',
  'Flag any question for review — flagged items are highlighted in the navigator.',
  'Every answer is saved automatically, so a refresh will not lose your work.',
  'The section submits itself automatically when the 20 minute limit is reached.',
]

export default function ReadingTest() {
  const { session, answerQuestion, toggleFlag, setCurrentIndex } = useSession()
  const runtime = useExamRuntime('reading')
  const [mobileTab, setMobileTab] = useState<'passage' | 'questions'>('passage')
  const questionPanelRef = useRef<HTMLDivElement>(null)

  const state = session?.reading ?? null
  const passage = useMemo(
    () => getReadingPassage(state?.passageId ?? ''),
    [state?.passageId],
  )
  const questions = passage.questions
  const currentIndex = Math.min(state?.currentIndex ?? 0, questions.length - 1)
  const question = questions[currentIndex]
  const locked = runtime.locked

  const goTo = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(questions.length - 1, index))
      setCurrentIndex('reading', bounded)
      setMobileTab('questions')
      questionPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [questions.length, setCurrentIndex],
  )

  /* Keyboard shortcuts: arrows move between questions, digits pick an option. */
  useEffect(() => {
    if (locked || !question) return
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(currentIndex + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goTo(currentIndex - 1)
      } else if (/^[1-9]$/.test(event.key)) {
        const optionIndex = Number(event.key) - 1
        if (optionIndex < question.options.length) {
          event.preventDefault()
          answerQuestion('reading', question.id, optionIndex)
        }
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFlag('reading', question.id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [locked, question, currentIndex, goTo, answerQuestion, toggleFlag])

  if (!session) return <Navigate to="/" replace />

  const answers = state?.answers ?? {}
  const flagged = state?.flagged ?? []
  const answeredCount = Object.keys(answers).length

  const passagePane = (
    <section
      className="surface-card flex h-full min-h-0 flex-col"
      aria-label="Reading passage"
    >
      <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info" icon="book">
            Reading Passage
          </Badge>
          <Badge tone="neutral">{passage.wordCount} words</Badge>
        </div>
        <h2 className="mt-2.5 font-serif text-xl font-bold text-slate-900 dark:text-slate-50">
          {passage.title}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{passage.subtitle}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
        <div className="space-y-4">
          {passage.paragraphs.map((paragraph) => (
            <div key={paragraph.label} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {paragraph.label}
              </span>
              <p className="font-serif text-[15px] leading-7 text-slate-800 dark:text-slate-200">
                {paragraph.text}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 border-t border-slate-200 pt-3 text-xs italic text-slate-400 dark:border-slate-800">
          {passage.source}
        </p>
      </div>
    </section>
  )

  const summaryContext =
    question?.type === 'summary' ? (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {passage.summaryTask.title}
        </p>
        <p className="mt-2 font-serif text-sm leading-7 text-slate-700 dark:text-slate-200">
          {passage.summaryTask.text}
        </p>
      </div>
    ) : null

  const questionsPane = (
    <section className="surface-card flex h-full min-h-0 flex-col" aria-label="Questions">
      <div ref={questionPanelRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-5">
        {question && (
          <ChoiceQuestionCard
            question={question}
            index={currentIndex}
            total={questions.length}
            selected={answers[question.id]}
            flagged={flagged.includes(question.id)}
            disabled={locked}
            context={summaryContext}
            onSelect={(optionIndex) => answerQuestion('reading', question.id, optionIndex)}
            onToggleFlag={() => toggleFlag('reading', question.id)}
          />
        )}
      </div>

      <footer className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <Button
          variant="outline"
          size="sm"
          icon="chevronLeft"
          disabled={currentIndex === 0 || locked}
          onClick={() => goTo(currentIndex - 1)}
        >
          Previous
        </Button>
        <span className="mx-auto text-xs font-medium text-slate-400">
          {answeredCount} of {questions.length} answered
        </span>
        {currentIndex === questions.length - 1 ? (
          <Button
            variant="success"
            size="sm"
            icon="check"
            disabled={locked}
            onClick={runtime.requestSubmit}
          >
            Submit Section
          </Button>
        ) : (
          <Button
            size="sm"
            iconRight="chevronRight"
            disabled={locked}
            onClick={() => goTo(currentIndex + 1)}
          >
            Next
          </Button>
        )}
      </footer>
    </section>
  )

  return (
    <ExamShell
      skill="reading"
      runtime={runtime}
      briefingTitle="Reading Section"
      briefingSubtitle="Academic reading · 13 questions · 20 minutes"
      briefingPoints={BRIEFING_POINTS}
      submitSummary={
        <Alert tone={answeredCount === questions.length ? 'success' : 'warning'}>
          {answeredCount === questions.length
            ? 'All questions answered. Ready to submit.'
            : `${questions.length - answeredCount} question(s) are still unanswered. Unanswered questions score zero.`}
        </Alert>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_18rem]">
        <div className="lg:hidden">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {(['passage', 'questions'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMobileTab(tab)}
                className={cn(
                  'flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize transition',
                  mobileTab === tab
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'h-[calc(100vh-7.5rem)] min-h-0',
            mobileTab === 'passage' ? 'block' : 'hidden',
            'lg:block',
          )}
        >
          {passagePane}
        </div>

        <div
          className={cn(
            'h-[calc(100vh-7.5rem)] min-h-0',
            mobileTab === 'questions' ? 'block' : 'hidden',
            'lg:block',
          )}
        >
          {questionsPane}
        </div>

        <div className="space-y-3 lg:col-span-2 xl:col-span-1">
          <QuestionNavigator
            questions={questions.map((item, index) => ({ id: item.id, label: String(index + 1) }))}
            answers={answers}
            flagged={flagged}
            currentIndex={currentIndex}
            disabled={locked}
            onNavigate={goTo}
          />
          <IntegrityPanel
            videoRef={runtime.videoRef}
            monitor={runtime.monitor}
            proctor={session.proctor}
          />
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
              <Icon name="info" size={13} /> Keyboard shortcuts
            </p>
            <p>← / → move between questions · 1-4 select an option · F flags for review</p>
          </div>
        </div>
      </div>
    </ExamShell>
  )
}
