import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { RadarChart } from '@/components/charts/RadarChart'
import { CalendarHeatmap, PerformanceHeatmap } from '@/components/charts/Heatmaps'
import { TrendChart } from '@/components/charts/TrendChart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { ProgressRing } from '@/components/ui/Progress'
import { useProfile } from '@/context/profile'
import { useSession } from '@/context/session'
import type { Difficulty, SkillId } from '@/types'
import { cefrBand } from '@/utils/cefr'
import { cn } from '@/utils/cn'
import { FULL_TEST_PLAN, SKILL_ACCENTS, SKILL_LABELS, SKILL_ROUTES } from '@/utils/constants'
import { skillLabel } from '@/utils/profile'
import { sessionProgress } from '@/utils/progress'
import { titleCase } from '@/utils/text'
import { formatDateTime, toDayKey } from '@/utils/time'

const SKILL_META: Record<SkillId, { icon: IconName; blurb: string; detail: string }> = {
  listening: {
    icon: 'headphones',
    blurb: 'Two recordings, ten questions',
    detail: 'Each recording plays a maximum of twice',
  },
  reading: {
    icon: 'book',
    blurb: 'One passage, thirteen questions',
    detail: 'True/False/Not Given, summary, inference and more',
  },
  writing: {
    icon: 'pen',
    blurb: 'One essay task',
    detail: 'Live word count with 100–180 word limits',
  },
  speaking: {
    icon: 'mic',
    blurb: 'Repeat sentence and cue card',
    detail: '30s preparation, 20–40s long turn',
  },
}

const DIFFICULTY_META: Record<Difficulty, { label: string; range: string }> = {
  beginner: { label: 'Beginner', range: 'A1 – A2' },
  intermediate: { label: 'Intermediate', range: 'B1 – B2' },
  advanced: { label: 'Advanced', range: 'C1 – C2' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile, stats, currentDifficulty, setName, setDifficulty, setAutoAdapt } = useProfile()
  const { session, startSession, clearSession } = useSession()

  const [nameDraft, setNameDraft] = useState(profile.name)
  const [editingName, setEditingName] = useState(false)
  const [pendingStart, setPendingStart] = useState<{ mode: 'full' | 'single'; skill?: SkillId } | null>(
    null,
  )
  const [pathFocus, setPathFocus] = useState<SkillId | null>(null)

  const unfinished = session && !session.completedAt ? session : null
  const band = cefrBand(stats.averageCefr)
  const practicedToday = profile.streak.history.includes(toDayKey())
  const nextSkill =
    FULL_TEST_PLAN.find((skill) => stats.skillAverages[skill] == null) ?? FULL_TEST_PLAN[0]
  const highlightedSkill = pathFocus ?? nextSkill
  const dailyQuests = [
    { id: 'today', label: 'Practise today', done: practicedToday },
    {
      id: 'full',
      label: 'Finish a full mock',
      done: profile.results.some((result) => result.mode === 'full'),
    },
    { id: 'cert', label: 'Claim a certificate', done: profile.certificates.length > 0 },
  ]

  const radarData = useMemo(
    () =>
      (['listening', 'reading', 'writing', 'speaking'] as SkillId[]).map((skill) => ({
        label: SKILL_LABELS[skill].slice(0, 5),
        value: stats.skillAverages[skill] ?? 0,
      })),
    [stats.skillAverages],
  )

  const launch = (mode: 'full' | 'single', skill?: SkillId) => {
    if (unfinished) {
      setPendingStart({ mode, skill })
      return
    }
    beginSession(mode, skill)
  }

  const beginSession = (mode: 'full' | 'single', skill?: SkillId) => {
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

  const confirmDiscard = () => {
    if (!pendingStart) return
    clearSession()
    const { mode, skill } = pendingStart
    setPendingStart(null)
    // The provider clears synchronously, so the new session can start immediately.
    window.setTimeout(() => beginSession(mode, skill), 0)
  }

  const saveName = () => {
    setName(nameDraft)
    setEditingName(false)
  }

  return (
    <div className="space-y-6">
      {unfinished && (
        <Card className="animate-slide-up overflow-hidden border-amber-300/70 dark:border-amber-800">
          <div className="flex flex-wrap items-center gap-4 bg-amber-50/70 p-5 dark:bg-amber-950/25">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Icon name="refresh" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                You have an unfinished {unfinished.mode === 'full' ? 'full test' : 'section'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Started {formatDateTime(unfinished.createdAt)} · {sessionProgress(unfinished)}% complete
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon="trash"
                onClick={() => {
                  clearSession()
                }}
              >
                Discard
              </Button>
              <Button
                icon="play"
                onClick={() => {
                  const next =
                    unfinished.plan.find((skill) => {
                      const state = unfinished[skill]
                      return !state || (state.status !== 'submitted' && state.status !== 'expired')
                    }) ?? unfinished.plan[0]
                  navigate(SKILL_ROUTES[next])
                }}
              >
                Resume Test
              </Button>
            </div>
          </div>
        </Card>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Card glass className="overflow-hidden">
            <div className="relative p-6 sm:p-8">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
                style={{ backgroundColor: band.color }}
              />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand" icon="sparkles">
                    {DIFFICULTY_META[currentDifficulty].label} level
                  </Badge>
                  {profile.autoAdapt && <Badge tone="info">Adaptive difficulty on</Badge>}
                </div>

                {editingName ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && saveName()}
                      aria-label="Candidate name"
                      maxLength={40}
                      className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-lg font-bold text-slate-900 outline-none focus-visible:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    />
                    <Button icon="check" onClick={saveName}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <h1 className="mt-4 flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    Welcome back, {profile.name}
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(profile.name)
                        setEditingName(true)
                      }}
                      aria-label="Edit candidate name"
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <Icon name="pen" size={16} />
                    </button>
                  </h1>
                )}

                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Follow the skill path, keep your streak alive, and claim a practice certificate after
                  each attempt. Everything stays on this device.
                </p>
              </div>
            </div>
          </Card>

          <button
            type="button"
            onClick={() => launch('full')}
            className="group relative w-full overflow-hidden rounded-[28px] bg-brand-600 p-6 text-left text-white shadow-[0_8px_0_0_#1a34e1] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_3px_0_0_#1a34e1]"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15" />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-100">
              Section · Full mock
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight">Take the complete exam</p>
            <p className="mt-1 text-sm text-brand-100">
              Listening → Reading → Writing → Speaking · 80 minutes
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-brand-700">
              Start + certificate
              <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          <Card className="overflow-hidden">
            <CardHeader
              title="Skill path"
              subtitle="Tap a node to drill one module"
              icon="target"
              accent="#3366ff"
            />
            <CardBody className="pb-28">
              <div className="relative flex flex-wrap items-start justify-center gap-x-4 gap-y-16 py-6 sm:gap-x-10">
                <div className="pointer-events-none absolute left-10 right-10 top-16 hidden h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 sm:block" />
                {FULL_TEST_PLAN.map((skill, index) => {
                  const score = stats.totalTests ? stats.skillAverages[skill] : undefined
                  const selected = highlightedSkill === skill
                  return (
                    <div
                      key={skill}
                      className={cn(
                        'relative z-[1] flex w-24 flex-col items-center',
                        selected && 'z-20',
                      )}
                      style={{ marginTop: index % 2 === 0 ? 0 : 28 }}
                    >
                      <span
                        className="animate-float"
                        style={{ animationDelay: `${index * 180}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() => setPathFocus(skill)}
                          onDoubleClick={() => launch('single', skill)}
                          className={cn(
                            'path-node focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500',
                            selected &&
                              'ring-4 ring-white ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900',
                          )}
                          style={{
                            ['--node' as string]: SKILL_ACCENTS[skill],
                            backgroundColor: SKILL_ACCENTS[skill],
                          }}
                          aria-label={`${SKILL_LABELS[skill]} path node`}
                          aria-pressed={selected}
                        >
                          <Icon name={SKILL_META[skill].icon} size={28} />
                          {score != null && (
                            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-800 shadow">
                              {Math.round(score)}
                            </span>
                          )}
                        </button>
                      </span>
                      <span className="mt-2 text-[11px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                        {SKILL_LABELS[skill]}
                      </span>
                      {selected && (
                        <div
                          className="absolute left-1/2 top-[calc(100%+0.35rem)] z-10 w-52 -translate-x-1/2 rounded-2xl p-3 text-left text-white shadow-[0_8px_0_0_rgb(15_23_42_/_0.18)]"
                          style={{ backgroundColor: SKILL_ACCENTS[skill] }}
                        >
                          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm"
                            style={{ backgroundColor: SKILL_ACCENTS[skill] }}
                          />
                          <p className="relative text-sm font-black">{SKILL_LABELS[skill]}</p>
                          <p className="relative mt-0.5 text-[11px] leading-relaxed text-white/90">
                            {SKILL_META[skill].blurb}
                          </p>
                          <button
                            type="button"
                            onClick={() => launch('single', skill)}
                            className="relative mt-2 w-full rounded-xl bg-white py-2 text-xs font-black shadow-[0_3px_0_0_rgb(15_23_42_/_0.12)] active:translate-y-0.5 active:shadow-none"
                            style={{ color: SKILL_ACCENTS[skill] }}
                          >
                            Start + certificate
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                Tap a node, then start. Numbers on nodes are your average score.
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="flex flex-col items-center p-6">
            <div className="animate-[float_3.2s_ease-in-out_infinite]">
              <ProgressRing
                value={stats.averageScore}
                label={stats.totalTests ? stats.averageCefr : '—'}
                caption="Average CEFR"
                color={band.color}
                size={168}
                thickness={14}
              />
            </div>
            <p className="mt-3 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {stats.totalTests
                ? `${band.label} · average score ${stats.averageScore}%`
                : 'Complete your first test to see your CEFR level'}
            </p>
          </Card>

          <Card>
            <CardHeader title="Practice streak" icon="flame" accent="#f97316" />
            <CardBody>
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_5px_0_0_#c2410c]">
                  <Icon name="flame" size={30} />
                </span>
                <div className="flex flex-1 gap-6">
                  <div>
                    <p className="text-3xl font-black tabular-nums text-slate-900 dark:text-slate-50">
                      {profile.streak.current}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Current streak
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-black tabular-nums text-slate-900 dark:text-slate-50">
                      {profile.streak.longest}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Longest streak
                    </p>
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {dailyQuests.map((quest) => (
                  <li
                    key={quest.id}
                    className="flex items-center gap-2.5 rounded-xl border-2 border-b-4 border-slate-200 px-3 py-2 dark:border-slate-700"
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-white',
                        quest.done ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
                      )}
                    >
                      {quest.done ? <Icon name="check" size={14} /> : <span className="h-2 w-2 rounded-full bg-white/80" />}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        quest.done
                          ? 'text-slate-400 line-through'
                          : 'text-slate-800 dark:text-slate-100',
                      )}
                    >
                      {quest.label}
                    </span>
                  </li>
                ))}
              </ul>
              <CalendarHeatmap className="mt-4" days={profile.streak.history} weeks={14} />
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tests Taken', value: String(stats.totalTests), icon: 'document' as IconName, tone: '#3366ff' },
          {
            label: 'Best Skill',
            value: stats.bestSkill ? skillLabel(stats.bestSkill) : '—',
            icon: 'star' as IconName,
            tone: '#10b981',
          },
          {
            label: 'Weakest Skill',
            value: stats.weakestSkill ? skillLabel(stats.weakestSkill) : '—',
            icon: 'target' as IconName,
            tone: '#f59e0b',
          },
          {
            label: 'Avg Integrity',
            value: stats.averageIntegrity === null ? '—' : `${stats.averageIntegrity}%`,
            icon: 'shield' as IconName,
            tone: '#8b5cf6',
          },
        ].map((item) => (
          <Card key={item.label} className="p-5 transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${item.tone}1f`, color: item.tone }}
              >
                <Icon name={item.icon} size={19} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="truncate text-xl font-bold text-slate-900 dark:text-slate-50">
                  {item.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Skill profile"
            subtitle="Average score per module across all attempts"
            icon="chart"
            accent="#3366ff"
          />
          <CardBody className="flex justify-center">
            {stats.totalTests === 0 ? (
              <EmptyState
                icon="chart"
                title="No data yet"
                description="Your skill radar appears once you have completed a test."
              />
            ) : (
              <RadarChart data={radarData} size={260} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Score trend"
            subtitle="Overall score across your recent attempts"
            icon="chart"
            accent="#14b8a6"
          />
          <CardBody>
            {stats.trend.length === 0 ? (
              <EmptyState
                icon="chart"
                title="No attempts recorded"
                description="Complete a test to start tracking your progress over time."
              />
            ) : (
              <TrendChart data={stats.trend} color="#14b8a6" />
            )}
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader
            title="Performance heatmap"
            subtitle="Each column is one test attempt"
            icon="chart"
            accent="#8b5cf6"
          />
          <CardBody>
            <PerformanceHeatmap results={profile.results} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Test settings" icon="settings" accent="#64748b" />
          <CardBody className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Difficulty
              </p>
              <div className="mt-2 grid gap-2">
                {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((level) => {
                  const active = currentDifficulty === level
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        setAutoAdapt(false)
                        setDifficulty(level)
                      }}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border-2 border-b-4 px-3 py-2.5 text-left transition',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                        active
                          ? 'border-brand-500 bg-brand-500/8 shadow-[0_3px_0_0_#1a34e1]'
                          : 'border-slate-200 hover:-translate-y-0.5 hover:border-brand-300 active:translate-y-0.5 dark:border-slate-800',
                      )}
                    >
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full',
                          active ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700',
                        )}
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {DIFFICULTY_META[level].label}
                      </span>
                      <span className="ml-auto text-xs font-medium text-slate-400">
                        {DIFFICULTY_META[level].range}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <input
                type="checkbox"
                checked={profile.autoAdapt}
                onChange={(event) => setAutoAdapt(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Adaptive difficulty
                </span>
                <span className="block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Automatically move up a level after two strong results, and down after two weak
                  ones.
                </span>
              </span>
            </label>
          </CardBody>
        </Card>
      </section>

      {stats.lastResult && stats.lastResult.recommendations.length > 0 && (
        <section>
          <Card>
            <CardHeader
              title="Recommended practice"
              subtitle="Generated from your most recent attempt"
              icon="sparkles"
              accent="#f59e0b"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight="arrowRight"
                  onClick={() => navigate(`/results/${stats.lastResult?.id}`)}
                >
                  Full report
                </Button>
              }
            />
            <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {stats.lastResult.recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="flex flex-col rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <span style={{ color: SKILL_ACCENTS[recommendation.skill] }}>
                    <Icon name={SKILL_META[recommendation.skill].icon} size={18} />
                  </span>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {recommendation.title}
                  </p>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {recommendation.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral" icon="clock">
                      {recommendation.estimatedMinutes} min
                    </Badge>
                    <Badge tone="info">{titleCase(recommendation.difficulty)}</Badge>
                  </div>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    fullWidth
                    onClick={() => launch('single', recommendation.skill)}
                  >
                    Practise {SKILL_LABELS[recommendation.skill]}
                  </Button>
                </div>
              ))}
            </CardBody>
          </Card>
        </section>
      )}

      <section>
        <Card>
          <CardHeader
            title="Module overview"
            subtitle="Every module is capped at 20 minutes"
            icon="list"
            accent="#0ea5e9"
          />
          <CardBody className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {FULL_TEST_PLAN.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => launch('single', skill)}
                className="group flex flex-col rounded-2xl border-2 border-b-4 border-slate-200 p-4 text-left transition hover:-translate-y-1 hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:translate-y-0.5 dark:border-slate-800"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${SKILL_ACCENTS[skill]}1f`,
                    color: SKILL_ACCENTS[skill],
                  }}
                >
                  <Icon name={SKILL_META[skill].icon} size={20} />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-50">
                  {SKILL_LABELS[skill]}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{SKILL_META[skill].blurb}</p>
                <p className="mt-2 flex-1 text-[11px] leading-relaxed text-slate-400">
                  {SKILL_META[skill].detail}
                </p>
                <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                  Start section
                  <Icon
                    name="arrowRight"
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </button>
            ))}
          </CardBody>
        </Card>
      </section>

      <Modal
        open={!!pendingStart}
        title="Discard your unfinished test?"
        tone="warning"
        onClose={() => setPendingStart(null)}
        description="Starting a new test will permanently discard the session currently in progress."
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingStart(null)}>
              Keep Current Test
            </Button>
            <Button variant="danger" icon="trash" onClick={confirmDiscard}>
              Discard and Start
            </Button>
          </>
        }
      />
    </div>
  )
}
