import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { AudioPlayer } from '@/components/exam/AudioPlayer'
import { ExamActionBar } from '@/components/exam/ExamActionBar'
import { ExamShell } from '@/components/exam/ExamShell'
import { RecordingPlayback } from '@/components/exam/RecordingPlayback'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Alert } from '@/components/ui/Feedback'
import { ProgressRing } from '@/components/ui/Progress'
import { getSpeakingTaskSet } from '@/data/speakingTasks'
import { useSession } from '@/context/session'
import { useAudioRecorder, type RecorderResult } from '@/hooks/useAudioRecorder'
import { useCountdown } from '@/hooks/useCountdown'
import { useExamRuntime } from '@/hooks/useExamRuntime'
import type { RecordingMeta } from '@/types'
import { cn } from '@/utils/cn'
import { createId } from '@/utils/id'
import { saveRecording } from '@/utils/storage'
import { formatClock } from '@/utils/time'

const BRIEFING_POINTS = [
  'Part 1 asks you to listen to four short sentences and repeat each one aloud.',
  'Each sentence can be played a maximum of two times, exactly as in the listening section.',
  'Part 2 is an IELTS cue card: 30 seconds to prepare, then 20 to 40 seconds to speak.',
  'Recordings are stored on this device only and can be replayed on the results screen.',
  'This module uses your microphone. The camera is not used during the speaking test.',
]

type RecordTarget = { kind: 'repeat'; taskId: string } | { kind: 'cue' }

export default function SpeakingTest() {
  const { session, registerPlay, setSpeakingPosition, setRepeatRecording, setCueCardRecording } =
    useSession()
  const runtime = useExamRuntime('speaking')

  const state = session?.speaking ?? null
  const taskSet = useMemo(() => getSpeakingTaskSet(state?.taskSetId ?? ''), [state?.taskSetId])
  const locked = runtime.locked

  const part = state?.currentPart ?? 1
  const taskIndex = Math.min(state?.currentTaskIndex ?? 0, taskSet.repeatSentences.length - 1)
  const repeatTask = taskSet.repeatSentences[taskIndex]
  const cueCard = taskSet.cueCard

  const [savingRecording, setSavingRecording] = useState(false)
  const [cuePhase, setCuePhase] = useState<'idle' | 'preparing' | 'speaking' | 'done'>('idle')
  const targetRef = useRef<RecordTarget | null>(null)

  const handleRecordingComplete = useCallback(
    async (result: RecorderResult) => {
      const target = targetRef.current
      if (!target) return
      setSavingRecording(true)
      const meta: RecordingMeta = {
        id: createId('rec'),
        durationSeconds: Number(result.durationSeconds.toFixed(2)),
        mimeType: result.mimeType,
        createdAt: Date.now(),
        sizeBytes: result.blob.size,
      }
      await saveRecording(meta.id, result.blob)
      if (target.kind === 'repeat') setRepeatRecording(target.taskId, meta)
      else setCueCardRecording(meta)
      setSavingRecording(false)
      targetRef.current = null
    },
    [setRepeatRecording, setCueCardRecording],
  )

  const recorder = useAudioRecorder((result) => void handleRecordingComplete(result))
  const { stop: stopRecorder, start: startRecorder, prepare: prepareRecorder } = recorder

  const recordClock = useCountdown({
    initialSeconds: 15,
    onExpire: () => stopRecorder(),
  })
  const { reset: resetRecordClock, start: startRecordClock, pause: pauseRecordClock } = recordClock

  const beginRepeatRecording = useCallback(async () => {
    if (!repeatTask) return
    targetRef.current = { kind: 'repeat', taskId: repeatTask.id }
    const started = await startRecorder()
    if (!started) return
    resetRecordClock(repeatTask.recordSeconds)
    startRecordClock()
  }, [repeatTask, startRecorder, resetRecordClock, startRecordClock])

  const beginCueRecording = useCallback(async () => {
    targetRef.current = { kind: 'cue' }
    const started = await startRecorder()
    if (!started) {
      setCuePhase('idle')
      return
    }
    resetRecordClock(cueCard.maxSpeakSeconds)
    startRecordClock()
    setCuePhase('speaking')
  }, [startRecorder, resetRecordClock, startRecordClock, cueCard.maxSpeakSeconds])

  const prepClock = useCountdown({
    initialSeconds: cueCard.prepSeconds,
    onExpire: () => void beginCueRecording(),
  })
  const { reset: resetPrepClock, start: startPrepClock, pause: pausePrepClock } = prepClock

  useEffect(() => {
    if (runtime.phase === 'active') void prepareRecorder()
  }, [runtime.phase, prepareRecorder])

  useEffect(() => {
    if (!locked) return
    stopRecorder()
    pauseRecordClock()
    pausePrepClock()
  }, [locked, stopRecorder, pauseRecordClock, pausePrepClock])

  const stopRecording = useCallback(() => {
    stopRecorder()
    pauseRecordClock()
    if (cuePhase === 'speaking') setCuePhase('done')
  }, [stopRecorder, pauseRecordClock, cuePhase])

  const startPreparation = useCallback(() => {
    setCuePhase('preparing')
    resetPrepClock(cueCard.prepSeconds)
    startPrepClock()
  }, [resetPrepClock, startPrepClock, cueCard.prepSeconds])

  const skipPreparation = useCallback(() => {
    pausePrepClock()
    void beginCueRecording()
  }, [pausePrepClock, beginCueRecording])

  const handlePlayStart = useCallback(
    (clipId: string) => registerPlay('speaking', clipId),
    [registerPlay],
  )

  if (!session) return <Navigate to="/" replace />

  const playCounts = state?.playCounts ?? {}
  const repeatRecordings = state?.repeatRecordings ?? {}
  const cueRecording = state?.cueCardRecording ?? null
  const completedRepeats = taskSet.repeatSentences.filter((task) => repeatRecordings[task.id]).length
  const recording = recorder.status === 'recording'
  const cueDurationOk =
    !!cueRecording &&
    cueRecording.durationSeconds >= cueCard.minSpeakSeconds &&
    cueRecording.durationSeconds <= cueCard.maxSpeakSeconds + 2

  const currentRepeatRecording = repeatTask ? repeatRecordings[repeatTask.id] : undefined

  return (
    <ExamShell
      skill="speaking"
      runtime={runtime}
      briefingTitle="Speaking Section"
      briefingSubtitle="Repeat sentence + cue card · 20 minutes"
      briefingPoints={BRIEFING_POINTS}
      submitSummary={
        <Alert tone={completedRepeats === taskSet.repeatSentences.length && cueRecording ? 'success' : 'warning'}>
          {completedRepeats}/{taskSet.repeatSentences.length} repeat tasks recorded ·{' '}
          {cueRecording ? 'cue card recorded' : 'cue card not recorded'}. Missing recordings score zero.
        </Alert>
      }
      actionBar={
        part === 1 ? (
          <ExamActionBar
            onBack={() => setSpeakingPosition(1, taskIndex - 1)}
            backDisabled={taskIndex === 0 || locked || recording}
            hint={`${completedRepeats}/${taskSet.repeatSentences.length} sentences recorded`}
            primaryLabel={
              taskIndex === taskSet.repeatSentences.length - 1 ? 'Continue to Part 2' : 'Continue'
            }
            primaryDisabled={locked || recording}
            onPrimary={() =>
              taskIndex === taskSet.repeatSentences.length - 1
                ? setSpeakingPosition(2, 0)
                : setSpeakingPosition(1, taskIndex + 1)
            }
          />
        ) : (
          <ExamActionBar
            onBack={() => setSpeakingPosition(1, taskSet.repeatSentences.length - 1)}
            backDisabled={locked || recording}
            hint={cueRecording ? 'Cue card recorded' : 'Record your long turn'}
            primaryLabel="Submit"
            primaryDisabled={locked || recording}
            onPrimary={runtime.requestSubmit}
          />
        )
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          {!recorder.supported && (
            <Alert tone="danger" title="Recording unavailable">
              This browser does not support the MediaRecorder API, so spoken answers cannot be
              captured. Try the latest Chrome, Edge, Firefox or Safari.
            </Alert>
          )}
          {recorder.error && (
            <Alert tone="warning" title="Microphone problem">
              {recorder.error}
            </Alert>
          )}

          <div className="flex gap-2">
            {([1, 2] as const).map((value) => {
              const active = part === value
              const complete =
                value === 1 ? completedRepeats === taskSet.repeatSentences.length : !!cueRecording
              return (
                <button
                  key={value}
                  type="button"
                  disabled={locked}
                  onClick={() => setSpeakingPosition(value, value === 1 ? taskIndex : 0)}
                  className={cn(
                    'flex flex-1 items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 text-left transition',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60',
                    active
                      ? 'border-brand-500 bg-brand-500/8 shadow-[0_3px_0_0_#1a34e1]'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                      complete
                        ? 'bg-emerald-500 text-white'
                        : active
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                    )}
                  >
                    {complete ? <Icon name="check" size={17} /> : value}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {value === 1 ? 'Part 1 · Repeat Sentence' : 'Part 2 · Cue Card'}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {value === 1
                        ? `${completedRepeats}/${taskSet.repeatSentences.length} recorded`
                        : cueRecording
                          ? 'Recorded'
                          : 'Not recorded'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {part === 1 && repeatTask && (
            <section className="surface-card p-5" aria-label="Repeat sentence task">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">
                  Sentence {taskIndex + 1} of {taskSet.repeatSentences.length}
                </Badge>
                <Badge tone="neutral">Listen, then repeat aloud</Badge>
              </div>

              <ol className="mt-4 flex flex-wrap gap-2">
                {taskSet.repeatSentences.map((task, index) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      disabled={locked || recording}
                      onClick={() => setSpeakingPosition(1, index)}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg border-2 border-b-4 text-xs font-bold transition disabled:opacity-50',
                        repeatRecordings[task.id]
                          ? 'border-emerald-400 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400',
                        index === taskIndex &&
                          'border-brand-500 bg-brand-600 text-white shadow-[0_3px_0_0_#1a34e1]',
                      )}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
              </ol>

              <div className="mt-4">
                <AudioPlayer
                  clipId={repeatTask.id}
                  title={`Sentence ${taskIndex + 1}`}
                  speakerLabel="Listen carefully — you may play this twice"
                  src={repeatTask.audioSrc}
                  transcript={repeatTask.text}
                  estimatedSeconds={Math.max(4, Math.round(repeatTask.text.split(' ').length / 2.2))}
                  playsUsed={playCounts[repeatTask.id] ?? 0}
                  disabled={locked || recording}
                  onPlayStart={handlePlayStart}
                />
              </div>

              <div className="mt-4 rounded-2xl border-2 border-b-4 border-slate-200 p-5 dark:border-slate-800">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  {recording ? (
                    <>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_8px_0_0_#9f1239] transition active:translate-y-1 active:shadow-[0_3px_0_0_#9f1239]"
                        aria-label="Stop recording"
                      >
                        <Icon name="stop" size={32} />
                      </button>
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-black text-rose-600 dark:text-rose-400">Recording…</p>
                        <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                          Stops automatically in {formatClock(recordClock.secondsRemaining)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void beginRepeatRecording()}
                        disabled={locked || !recorder.supported || (playCounts[repeatTask.id] ?? 0) === 0 || savingRecording}
                        className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_8px_0_0_#1a34e1] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_3px_0_0_#1a34e1] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                        aria-label={currentRepeatRecording ? 'Record again' : 'Start recording'}
                      >
                        <Icon name="mic" size={36} />
                      </button>
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {currentRepeatRecording ? 'Answer recorded — tap to retry' : 'Tap to record'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          You have {repeatTask.recordSeconds} seconds to repeat the sentence.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {(playCounts[repeatTask.id] ?? 0) === 0 && !recording && (
                  <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Play the sentence at least once before recording your answer.
                  </p>
                )}

                {currentRepeatRecording && (
                  <RecordingPlayback
                    className="mt-3"
                    recordingId={currentRepeatRecording.id}
                    durationSeconds={currentRepeatRecording.durationSeconds}
                  />
                )}

                {currentRepeatRecording && (playCounts[repeatTask.id] ?? 0) > 0 && (
                  <details className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60">
                    <summary className="cursor-pointer font-semibold text-slate-600 dark:text-slate-300">
                      Show reference sentence
                    </summary>
                    <p className="mt-2 font-serif text-sm leading-6 text-slate-700 dark:text-slate-200">
                      “{repeatTask.text}”
                    </p>
                  </details>
                )}
              </div>
            </section>
          )}

          {part === 2 && (
            <section className="surface-card p-5" aria-label="Cue card task">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div>
                  <Badge tone="brand" icon="document">
                    {cueCard.title}
                  </Badge>
                  <h2 className="mt-3 font-serif text-xl font-bold text-slate-900 dark:text-slate-50">
                    {cueCard.prompt}
                  </h2>
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    You should say:
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {cueCard.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {cuePhase === 'preparing' ? (
                    <ProgressRing
                      value={(prepClock.secondsRemaining / cueCard.prepSeconds) * 100}
                      label={formatClock(prepClock.secondsRemaining)}
                      caption="Preparation"
                      color="#f59e0b"
                      size={128}
                    />
                  ) : cuePhase === 'speaking' ? (
                    <ProgressRing
                      value={(recordClock.secondsRemaining / cueCard.maxSpeakSeconds) * 100}
                      label={formatClock(recordClock.secondsRemaining)}
                      caption="Speaking"
                      color="#e11d48"
                      size={128}
                    />
                  ) : (
                    <ProgressRing
                      value={cueRecording ? 100 : 0}
                      label={cueRecording ? formatClock(cueRecording.durationSeconds) : '--:--'}
                      caption={cueRecording ? 'Recorded' : 'Ready'}
                      color={cueRecording ? '#10b981' : '#94a3b8'}
                      size={128}
                    />
                  )}
                  <p className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Speak for {cueCard.minSpeakSeconds}–{cueCard.maxSpeakSeconds} seconds
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                {cuePhase === 'idle' && (
                  <Button
                    icon="clock"
                    disabled={locked || !recorder.supported}
                    onClick={startPreparation}
                  >
                    Start 30s Preparation
                  </Button>
                )}
                {cuePhase === 'preparing' && (
                  <>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Prepare your answer. Recording begins automatically.
                    </p>
                    <Button className="ml-auto" variant="outline" icon="mic" onClick={skipPreparation}>
                      Start Speaking Now
                    </Button>
                  </>
                )}
                {cuePhase === 'speaking' && (
                  <>
                    <span className="flex items-center gap-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse" />
                      Recording your long turn…
                    </span>
                    <Button className="ml-auto" variant="danger" icon="stop" onClick={stopRecording}>
                      Stop Recording
                    </Button>
                  </>
                )}
                {(cuePhase === 'done' || (cuePhase === 'idle' && cueRecording)) && (
                  <>
                    <Button
                      variant="outline"
                      icon="refresh"
                      disabled={locked}
                      loading={savingRecording}
                      onClick={() => {
                        setCuePhase('idle')
                        startPreparation()
                      }}
                    >
                      Record Again
                    </Button>
                    <Button
                      className="ml-auto"
                      variant="success"
                      icon="check"
                      disabled={locked}
                      onClick={runtime.requestSubmit}
                    >
                      Submit Speaking Section
                    </Button>
                  </>
                )}
              </div>

              {cueRecording && (
                <>
                  <RecordingPlayback
                    className="mt-4"
                    recordingId={cueRecording.id}
                    durationSeconds={cueRecording.durationSeconds}
                    label="Your cue card response"
                  />
                  {!cueDurationOk && (
                    <Alert tone="warning" className="mt-3">
                      Your response was {Math.round(cueRecording.durationSeconds)} seconds, outside the{' '}
                      {cueCard.minSpeakSeconds}–{cueCard.maxSpeakSeconds} second window. Recording
                      again will improve your timing-compliance score.
                    </Alert>
                  )}
                </>
              )}
            </section>
          )}

        </div>

        <aside className="space-y-3">
          <div className="surface-card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recording status
            </h3>
            <ul className="mt-3 space-y-2">
              {taskSet.repeatSentences.map((task, index) => {
                const done = !!repeatRecordings[task.id]
                return (
                  <li key={task.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold',
                        done
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
                      )}
                    >
                      {done ? <Icon name="check" size={13} /> : index + 1}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">Sentence {index + 1}</span>
                    <span className="ml-auto text-xs tabular-nums text-slate-400">
                      {done ? `${repeatRecordings[task.id].durationSeconds.toFixed(1)}s` : '—'}
                    </span>
                  </li>
                )
              })}
              <li className="flex items-center gap-2 border-t border-slate-200 pt-2 text-sm dark:border-slate-800">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold',
                    cueRecording
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
                  )}
                >
                  {cueRecording ? <Icon name="check" size={13} /> : '2'}
                </span>
                <span className="text-slate-600 dark:text-slate-300">Cue card</span>
                <span className="ml-auto text-xs tabular-nums text-slate-400">
                  {cueRecording ? `${cueRecording.durationSeconds.toFixed(1)}s` : '—'}
                </span>
              </li>
            </ul>
          </div>

          <Alert tone="info">
            The camera is switched off for the speaking section. Only your microphone is used, and
            recordings never leave this device.
          </Alert>
        </aside>
      </div>
    </ExamShell>
  )
}
