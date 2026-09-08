import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { RadarChart } from '@/components/charts/RadarChart'
import { RecordingPlayback } from '@/components/exam/RecordingPlayback'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert, EmptyState } from '@/components/ui/Feedback'
import { Icon, type IconName } from '@/components/ui/Icon'
import { ProgressBar, ProgressRing } from '@/components/ui/Progress'
import { ACHIEVEMENTS } from '@/data/achievements'
import { getSpeakingTaskSet } from '@/data/speakingTasks'
import { useProfile } from '@/context/profile'
import { useSession } from '@/context/session'
import type { ChoiceReviewItem, SkillId, TestResult } from '@/types'
import { cefrBand } from '@/utils/cefr'
import { cn } from '@/utils/cn'
import {
  FULL_TEST_PLAN,
  INTEGRITY_EVENT_LABELS,
  QUESTION_TYPE_LABELS,
  SKILL_ACCENTS,
  SKILL_LABELS,
  SKILL_ROUTES,
} from '@/utils/constants'
import { downloadReport } from '@/utils/pdf'
import { STORAGE_KEYS, readJSON } from '@/utils/storage'
import { formatDateTime, formatDuration, formatTimeOfDay } from '@/utils/time'

type TabId = 'overview' | 'analytics' | 'answers' | 'writing' | 'speaking' | 'integrity'

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'chart' },
  { id: 'analytics', label: 'Analytics', icon: 'target' },
  { id: 'answers', label: 'Review Answers', icon: 'list' },
  { id: 'writing', label: 'Writing', icon: 'pen' },
  { id: 'speaking', label: 'Speaking', icon: 'mic' },
  { id: 'integrity', label: 'Integrity', icon: 'shield' },
]

export default function Results() {
  const { resultId } = useParams<{ resultId: string }>()
  const navigate = useNavigate()
  const { profile, currentDifficulty, recentUnlocks, clearRecentUnlocks } = useProfile()
  const { startSession } = useSession()
  const [tab, setTab] = useState<TabId>('overview')
  const [downloading, setDownloading] = useState(false)

  const result: TestResult | null = useMemo(() => {
    const fromProfile = profile.results.find((item) => item.id === resultId)
    if (fromProfile) return fromProfile
    const stored = readJSON<TestResult | null>(STORAGE_KEYS.lastResult, null)
    if (stored && (!resultId || stored.id === resultId)) return stored
    return profile.results.length ? profile.results[profile.results.length - 1] : null
  }, [profile.results, resultId])

  const unlocked = useMemo(
    () => ACHIEVEMENTS.filter((achievement) => recentUnlocks.includes(achievement.id)),
    [recentUnlocks],
  )

  useEffect(() => () => clearRecentUnlocks(), [clearRecentUnlocks])

  if (!result) {
    return (
      <EmptyState
        icon="document"
        title="No results to display"
        description="Complete a test to generate a report."
        action={
          <Button icon="home" onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
        }
      />
    )
  }

  const band = cefrBand(result.cefr)

  const sectionScores: { skill: SkillId; score: number; detail: string }[] = []
  if (result.listening)
    sectionScores.push({
      skill: 'listening',
      score: result.listening.score,
      detail: `${result.listening.correct}/${result.listening.total} correct`,
    })
  if (result.reading)
    sectionScores.push({
      skill: 'reading',
      score: result.reading.score,
      detail: `${result.reading.correct}/${result.reading.total} correct`,
    })
  if (result.writing)
    sectionScores.push({
      skill: 'writing',
      score: result.writing.score,
      detail: `${result.writing.wordCount} words`,
    })
  if (result.speaking)
    sectionScores.push({
      skill: 'speaking',
      score: result.speaking.score,
      detail: `${result.speaking.repeatCompleted}/${result.speaking.repeatTotal} + cue card`,
    })

  const retake = (mode: 'full' | 'single', skill?: SkillId) => {
    const skills = mode === 'full' ? FULL_TEST_PLAN : [skill as SkillId]
    startSession({
      mode,
      skills,
      difficulty: currentDifficulty,
      candidateName: profile.name,
      variantIndex: profile.results.length,
    })
    navigate(SKILL_ROUTES[skills[0]])
  }

  const handleDownload = () => {
    setDownloading(true)
    try {
      downloadReport(result)
    } catch (error) {
      console.error('[report] generation failed', error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {unlocked.length > 0 && (
        <Card className="animate-pop overflow-hidden border-amber-300/70 dark:border-amber-800">
          <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:from-amber-950/40 dark:to-orange-950/30">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Icon name="trophy" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                {unlocked.length} new achievement{unlocked.length === 1 ? '' : 's'} unlocked
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {unlocked.map((item) => item.title).join(' · ')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/achievements')}>
              View all
            </Button>
          </div>
        </Card>
      )}

      <Card glass className="overflow-hidden">
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: band.color }}
          />
          <div className="relative flex justify-center">
            <ProgressRing
              value={result.overallScore}
              label={result.cefr}
              caption={`${result.overallScore}% overall`}
              color={band.color}
              size={168}
              thickness={13}
            />
          </div>

          <div className="relative min-w-0">
            <Badge tone="brand" icon="document">
              {result.mode === 'full' ? 'Full mock test' : 'Individual skill test'}
            </Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {band.label} · CEFR {result.cefr}
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{band.description}</p>
            <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
              {result.candidateName} · {formatDateTime(result.completedAt)} · {result.difficulty} level
            </p>
          </div>

          <div className="relative flex flex-col gap-2">
            <Button icon="download" loading={downloading} onClick={handleDownload}>
              Download PDF Report
            </Button>
            <Button variant="outline" icon="refresh" onClick={() => retake('full')}>
              Retake Full Test
            </Button>
            <Button variant="ghost" icon="home" onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sectionScores.map((section) => (
          <Card key={section.skill} className="p-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${SKILL_ACCENTS[section.skill]}1f`,
                  color: SKILL_ACCENTS[section.skill],
                }}
              >
                <Icon
                  name={
                    section.skill === 'reading'
                      ? 'book'
                      : section.skill === 'listening'
                        ? 'headphones'
                        : section.skill === 'writing'
                          ? 'pen'
                          : 'mic'
                  }
                  size={19}
                />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {SKILL_LABELS[section.skill]}
                </p>
                <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                  {section.score}%
                </p>
              </div>
            </div>
            <ProgressBar
              className="mt-4"
              value={section.score}
              color={SKILL_ACCENTS[section.skill]}
              showValue={false}
              hint={section.detail}
              size="sm"
            />
            <Button
              className="mt-3"
              size="sm"
              variant="ghost"
              fullWidth
              icon="refresh"
              onClick={() => retake('single', section.skill)}
            >
              Retake {SKILL_LABELS[section.skill]}
            </Button>
          </Card>
        ))}
      </section>

      <div
        role="tablist"
        aria-label="Report sections"
        className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white/70 p-1 dark:border-slate-800 dark:bg-slate-900/70"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
              tab === item.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab result={result} />}
      {tab === 'analytics' && <AnalyticsTab result={result} />}
      {tab === 'answers' && <AnswersTab result={result} />}
      {tab === 'writing' && <WritingTab result={result} />}
      {tab === 'speaking' && <SpeakingTab result={result} />}
      {tab === 'integrity' && <IntegrityTab result={result} />}
    </div>
  )
}

function OverviewTab({ result }: { result: TestResult }) {
  const radarData = (['listening', 'reading', 'writing', 'speaking'] as SkillId[])
    .filter((skill) => result[skill])
    .map((skill) => ({ label: SKILL_LABELS[skill].slice(0, 5), value: result[skill]?.score ?? 0 }))

  return (
    <div className="grid gap-4 animate-fade-in lg:grid-cols-2">
      <Card>
        <CardHeader title="Skill profile" subtitle="This attempt" icon="chart" accent="#3366ff" />
        <CardBody className="flex justify-center">
          {radarData.length >= 3 ? (
            <RadarChart data={radarData} size={270} />
          ) : (
            <div className="w-full space-y-4 py-4">
              {radarData.map((item) => (
                <ProgressBar key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Strengths" icon="star" accent="#10b981" />
          <CardBody>
            <ul className="space-y-2">
              {result.strengths.length === 0 && (
                <li className="text-sm text-slate-500">No specific strengths identified.</li>
              )}
              {result.strengths.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Areas for improvement" icon="target" accent="#f59e0b" />
          <CardBody>
            <ul className="space-y-2">
              {result.weaknesses.length === 0 && (
                <li className="text-sm text-slate-500">No specific weaknesses identified.</li>
              )}
              {result.weaknesses.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
                  <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-amber-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card className="lg:col-span-2">
        <CardHeader
          title="Recommended learning path"
          subtitle="Personalised from this attempt"
          icon="sparkles"
          accent="#8b5cf6"
        />
        <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {result.recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {recommendation.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {recommendation.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge tone="brand">{recommendation.focus}</Badge>
                <Badge tone="neutral" icon="clock">
                  {recommendation.estimatedMinutes} min
                </Badge>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  )
}

function AnalyticsTab({ result }: { result: TestResult }) {
  const blocks = (['listening', 'reading', 'writing', 'speaking'] as SkillId[])
    .map((skill) => ({ skill, section: result[skill] }))
    .filter((item) => item.section)

  return (
    <div className="grid gap-4 animate-fade-in lg:grid-cols-2">
      {blocks.map(({ skill, section }) => (
        <Card key={skill}>
          <CardHeader
            title={`${SKILL_LABELS[skill]} analytics`}
            subtitle={`Section score ${section?.score}% · ${formatDuration(section?.timeSpentSeconds ?? 0)} spent`}
            icon={
              skill === 'reading'
                ? 'book'
                : skill === 'listening'
                  ? 'headphones'
                  : skill === 'writing'
                    ? 'pen'
                    : 'mic'
            }
            accent={SKILL_ACCENTS[skill]}
          />
          <CardBody className="space-y-4">
            {section?.metrics.map((metric) => (
              <ProgressBar
                key={metric.label}
                label={metric.label}
                value={metric.value}
                hint={metric.detail}
                color={SKILL_ACCENTS[skill]}
              />
            ))}
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Strength
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {section?.feedback.strengths[0] ?? 'Not enough data.'}
              </p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Improvement
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {section?.feedback.improvements[0] ?? 'Not enough data.'}
              </p>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

function ReviewList({ items, accent }: { items: ChoiceReviewItem[]; accent: string }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => (
        <li
          key={item.questionId}
          className={cn(
            'rounded-xl border p-4',
            item.correct
              ? 'border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
              : 'border-rose-300/60 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {index + 1}
            </span>
            <Badge tone="neutral">{QUESTION_TYPE_LABELS[item.type]}</Badge>
            <Badge tone={item.correct ? 'success' : 'danger'} icon={item.correct ? 'check' : 'close'}>
              {item.correct ? 'Correct' : item.selectedIndex === null ? 'Not answered' : 'Incorrect'}
            </Badge>
          </div>
          <p className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
            {item.prompt}
          </p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-500 dark:text-slate-400">Your answer: </span>
              {item.selectedIndex === null ? '—' : item.options[item.selectedIndex]}
            </p>
            {!item.correct && (
              <p className="text-emerald-700 dark:text-emerald-300">
                <span className="font-medium">Correct answer: </span>
                {item.options[item.correctIndex]}
              </p>
            )}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {item.explanation}
          </p>
        </li>
      ))}
    </ol>
  )
}

function AnswersTab({ result }: { result: TestResult }) {
  if (!result.reading && !result.listening) {
    return (
      <EmptyState
        icon="list"
        title="No multiple-choice sections"
        description="This attempt did not include a reading or listening section."
      />
    )
  }

  return (
    <div className="grid gap-4 animate-fade-in xl:grid-cols-2">
      {result.listening && (
        <Card>
          <CardHeader
            title="Listening answers"
            subtitle={`${result.listening.correct}/${result.listening.total} correct · ${result.listening.sectionTitle}`}
            icon="headphones"
            accent={SKILL_ACCENTS.listening}
          />
          <CardBody>
            <ReviewList items={result.listening.review} accent={SKILL_ACCENTS.listening} />
          </CardBody>
        </Card>
      )}
      {result.reading && (
        <Card>
          <CardHeader
            title="Reading answers"
            subtitle={`${result.reading.correct}/${result.reading.total} correct · ${result.reading.passageTitle}`}
            icon="book"
            accent={SKILL_ACCENTS.reading}
          />
          <CardBody>
            <ReviewList items={result.reading.review} accent={SKILL_ACCENTS.reading} />
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function WritingTab({ result }: { result: TestResult }) {
  const writing = result.writing
  if (!writing) {
    return (
      <EmptyState
        icon="pen"
        title="No writing submission"
        description="This attempt did not include the writing module."
      />
    )
  }

  return (
    <div className="grid gap-4 animate-fade-in lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader
          title={writing.promptTitle}
          subtitle={`${writing.category} essay · submitted response`}
          icon="pen"
          accent={SKILL_ACCENTS.writing}
        />
        <CardBody>
          <Alert tone={writing.withinRange ? 'success' : 'warning'} className="mb-4">
            {writing.wordCount} words · required range {writing.minWords}–{writing.maxWords}
            {writing.withinRange ? ' · within range' : ' · outside range'}
          </Alert>
          <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            {writing.text ? (
              writing.text.split(/\n{2,}/).map((paragraph, index) => (
                <p
                  key={index}
                  className="font-serif text-[15px] leading-7 text-slate-800 dark:text-slate-100"
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-sm italic text-slate-500">No response was submitted.</p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Writing analysis" icon="chart" accent="#f59e0b" />
        <CardBody className="space-y-4">
          {writing.metrics.map((metric) => (
            <ProgressBar
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.detail}
              color={SKILL_ACCENTS.writing}
            />
          ))}
          <dl className="space-y-1.5 border-t border-slate-200 pt-3 text-sm dark:border-slate-800">
            {[
              { label: 'Sentences', value: String(writing.sentenceCount) },
              { label: 'Paragraphs', value: String(writing.paragraphCount) },
              {
                label: 'Avg sentence length',
                value: `${writing.averageSentenceLength.toFixed(1)} words`,
              },
              { label: 'Unique word ratio', value: `${Math.round(writing.uniqueWordRatio * 100)}%` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">{row.label}</dt>
                <dd className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  )
}

function SpeakingTab({ result }: { result: TestResult }) {
  const speaking = result.speaking
  if (!speaking) {
    return (
      <EmptyState
        icon="mic"
        title="No speaking recordings"
        description="This attempt did not include the speaking module."
      />
    )
  }

  const taskSet = getSpeakingTaskSet(speaking.taskSetId)

  return (
    <div className="grid gap-4 animate-fade-in lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader
          title="Speaking recordings"
          subtitle="Replay any answer from this attempt"
          icon="mic"
          accent={SKILL_ACCENTS.speaking}
        />
        <CardBody className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Part 1 · Repeat sentence
            </p>
            <div className="space-y-2.5">
              {taskSet.repeatSentences.map((task, index) => {
                const recording = speaking.repeatRecordings[task.id]
                return (
                  <div key={task.id}>
                    <p className="mb-1 text-sm text-slate-700 dark:text-slate-200">
                      <span className="font-semibold">{index + 1}.</span> “{task.text}”
                    </p>
                    {recording ? (
                      <RecordingPlayback
                        recordingId={recording.id}
                        durationSeconds={recording.durationSeconds}
                        label={`Sentence ${index + 1}`}
                      />
                    ) : (
                      <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        No recording captured
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Part 2 · Cue card
            </p>
            <p className="mb-2 font-serif text-sm text-slate-700 dark:text-slate-200">
              {taskSet.cueCard.prompt}
            </p>
            {speaking.cueCardRecording ? (
              <RecordingPlayback
                recordingId={speaking.cueCardRecording.id}
                durationSeconds={speaking.cueCardRecording.durationSeconds}
                label="Long turn response"
              />
            ) : (
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                No cue card recording captured
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Speaking analysis" icon="chart" accent="#10b981" />
        <CardBody className="space-y-4">
          {speaking.metrics.map((metric) => (
            <ProgressBar
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.detail}
              color={SKILL_ACCENTS.speaking}
            />
          ))}
          <Alert tone={speaking.cueCardWithinWindow ? 'success' : 'warning'}>
            {speaking.cueCardWithinWindow
              ? 'Cue card timing was compliant.'
              : 'Cue card timing fell outside the required window.'}
          </Alert>
        </CardBody>
      </Card>
    </div>
  )
}

function IntegrityTab({ result }: { result: TestResult }) {
  const { proctor } = result
  const tone =
    proctor.integrityScore >= 85 ? 'success' : proctor.integrityScore >= 60 ? 'warning' : 'danger'

  return (
    <div className="grid gap-4 animate-fade-in lg:grid-cols-[20rem_minmax(0,1fr)]">
      <Card className="flex flex-col items-center p-6">
        <ProgressRing
          value={proctor.integrityScore}
          caption="Integrity score"
          color={
            proctor.integrityScore >= 85
              ? '#10b981'
              : proctor.integrityScore >= 60
                ? '#f59e0b'
                : '#e11d48'
          }
          size={150}
        />
        <Alert tone={tone} className="mt-4 w-full">
          The integrity score is advisory. It never changes your language scores.
        </Alert>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Monitoring summary" icon="shield" accent="#8b5cf6" />
          <CardBody>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: 'Focus violations', value: proctor.focusViolations },
                { label: 'Tab switches', value: proctor.tabSwitches },
                { label: 'Fullscreen exits', value: proctor.fullscreenExits },
                { label: 'Face lost', value: proctor.faceLostCount },
                { label: 'Multiple faces', value: proctor.multipleFaceCount },
                { label: 'Head turns', value: proctor.headTurnCount },
                { label: 'Gaze deviations', value: proctor.gazeDeviationCount },
                { label: 'Long absences', value: proctor.longAbsenceCount },
                {
                  label: 'Monitored time',
                  value: formatDuration(proctor.monitoredSeconds),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Integrity event log"
            subtitle={`${proctor.events.length} event(s) recorded`}
            icon="list"
            accent="#64748b"
          />
          <CardBody>
            {proctor.events.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No integrity events were recorded during this attempt.
              </p>
            ) : (
              <ul className="max-h-80 space-y-1.5 overflow-y-auto scrollbar-thin pr-2">
                {[...proctor.events].reverse().map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg px-2 py-1.5 text-sm odd:bg-slate-50 dark:odd:bg-slate-800/40"
                  >
                    <span className="shrink-0 font-mono text-xs tabular-nums text-slate-400">
                      {formatTimeOfDay(event.at)}
                    </span>
                    <span
                      className={cn(
                        'font-medium',
                        event.severity === 'critical'
                          ? 'text-rose-600 dark:text-rose-400'
                          : event.severity === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-300',
                      )}
                    >
                      {INTEGRITY_EVENT_LABELS[event.type]}
                    </span>
                    <span className="ml-auto text-right text-xs text-slate-400">
                      {event.skill ? SKILL_LABELS[event.skill] : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
