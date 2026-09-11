import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Navigate } from 'react-router-dom'

import { AudioPlayer } from '@/components/exam/AudioPlayer'
import { ChoiceQuestionCard } from '@/components/exam/ChoiceQuestionCard'
import { ExamActionBar } from '@/components/exam/ExamActionBar'
import { ExamShell } from '@/components/exam/ExamShell'
import { IntegrityPanel } from '@/components/exam/IntegrityPanel'
import { QuestionNavigator } from '@/components/exam/QuestionNavigator'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Feedback'
import { getListeningSection } from '@/data/listeningSections'
import { useSession } from '@/context/session'
import { useExamRuntime } from '@/hooks/useExamRuntime'

const BRIEFING_POINTS = [
  'Two recordings with 10 questions in total. Recording 1 is a conversation, recording 2 is a monologue.',
  'Each recording can be played a maximum of two times. After the second play the control is locked permanently.',
  'You may pause and resume within a play — that does not count as a new play.',
  'Answers save automatically as you select them.',
  'The section submits itself automatically when the 20 minute limit is reached.',
]

export default function ListeningTest() {
  const { session, answerQuestion, toggleFlag, setCurrentIndex, registerPlay } = useSession()
  const runtime = useExamRuntime('listening')
  const questionPanelRef = useRef<HTMLDivElement>(null)

  const state = session?.listening ?? null
  const section = useMemo(() => getListeningSection(state?.sectionId ?? ''), [state?.sectionId])
  const questions = section.questions
  const currentIndex = Math.min(state?.currentIndex ?? 0, questions.length - 1)
  const question = questions[currentIndex]
  const locked = runtime.locked

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex('listening', Math.max(0, Math.min(questions.length - 1, index)))
      questionPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [questions.length, setCurrentIndex],
  )

  const handlePlayStart = useCallback(
    (clipId: string) => registerPlay('listening', clipId),
    [registerPlay],
  )

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
          answerQuestion('listening', question.id, optionIndex)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [locked, question, currentIndex, goTo, answerQuestion])

  if (!session) return <Navigate to="/" replace />

  const answers = state?.answers ?? {}
  const flagged = state?.flagged ?? []
  const playCounts = state?.playCounts ?? {}
  const answeredCount = Object.keys(answers).length
  const activeClipId = question?.clipId

  return (
    <ExamShell
      skill="listening"
      runtime={runtime}
      briefingTitle="Listening Section"
      briefingSubtitle="Two recordings · 10 questions · 20 minutes"
      briefingPoints={BRIEFING_POINTS}
      submitSummary={
        <Alert tone={answeredCount === questions.length ? 'success' : 'warning'}>
          {answeredCount === questions.length
            ? 'All questions answered. Ready to submit.'
            : `${questions.length - answeredCount} question(s) are still unanswered.`}
        </Alert>
      }
      actionBar={
        <ExamActionBar
          onBack={() => goTo(currentIndex - 1)}
          backDisabled={currentIndex === 0 || locked}
          hint={`${answeredCount} of ${questions.length} answered`}
          primaryLabel={currentIndex === questions.length - 1 ? 'Submit' : answers[question?.id ?? ''] !== undefined ? 'Continue' : 'Check'}
          primaryDisabled={locked}
          onPrimary={() =>
            currentIndex === questions.length - 1 ? runtime.requestSubmit() : goTo(currentIndex + 1)
          }
        />
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          <section aria-label="Audio recordings" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand" icon="headphones">
                {section.title}
              </Badge>
              <span className="text-sm text-slate-500 dark:text-slate-400">{section.subtitle}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {section.clips.map((clip) => (
                <div
                  key={clip.id}
                  className={
                    activeClipId === clip.id
                      ? 'rounded-2xl ring-2 ring-brand-500/60 ring-offset-2 ring-offset-slate-100 transition dark:ring-offset-slate-950'
                      : 'transition'
                  }
                >
                  <AudioPlayer
                    clipId={clip.id}
                    title={clip.title}
                    speakerLabel={clip.speakerLabel}
                    src={clip.audioSrc}
                    transcript={clip.transcript}
                    estimatedSeconds={clip.estimatedSeconds}
                    playsUsed={playCounts[clip.id] ?? 0}
                    disabled={locked}
                    onPlayStart={handlePlayStart}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card flex flex-col" aria-label="Questions">
            <div ref={questionPanelRef} className="max-h-[46vh] overflow-y-auto scrollbar-thin p-5">
              {question && (
                <ChoiceQuestionCard
                  question={question}
                  index={currentIndex}
                  total={questions.length}
                  selected={answers[question.id]}
                  flagged={flagged.includes(question.id)}
                  disabled={locked}
                  onSelect={(optionIndex) => answerQuestion('listening', question.id, optionIndex)}
                  onToggleFlag={() => toggleFlag('listening', question.id)}
                />
              )}
            </div>
            <footer className="flex items-center justify-center border-t border-slate-200 p-3 text-xs font-semibold text-slate-400 dark:border-slate-800">
              {answeredCount} of {questions.length} answered
            </footer>
          </section>
        </div>

        <div className="space-y-3">
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
        </div>
      </div>
    </ExamShell>
  )
}
