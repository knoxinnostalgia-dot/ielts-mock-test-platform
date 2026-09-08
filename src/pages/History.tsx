import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PerformanceHeatmap } from '@/components/charts/Heatmaps'
import { TrendChart } from '@/components/charts/TrendChart'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/Feedback'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { useProfile } from '@/context/profile'
import type { SkillId } from '@/types'
import { cefrBand } from '@/utils/cefr'
import { SKILL_ACCENTS, SKILL_LABELS } from '@/utils/constants'
import { downloadReport } from '@/utils/pdf'
import { formatDateTime } from '@/utils/time'

const SKILLS: SkillId[] = ['listening', 'reading', 'writing', 'speaking']

export default function History() {
  const navigate = useNavigate()
  const { profile, stats, deleteResult, resetProfile } = useProfile()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const results = [...profile.results].reverse()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Test History
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {profile.results.length} completed attempt{profile.results.length === 1 ? '' : 's'} stored
            locally on this device.
          </p>
        </div>
        {profile.results.length > 0 && (
          <Button variant="outline" icon="trash" onClick={() => setConfirmReset(true)}>
            Clear All Data
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="list"
          title="No tests completed yet"
          description="Your attempts, scores, integrity reports and recordings will appear here."
          action={
            <Button icon="play" onClick={() => navigate('/')}>
              Start Your First Test
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Score trend" icon="chart" accent="#14b8a6" />
              <CardBody>
                <TrendChart data={stats.trend} color="#14b8a6" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Performance heatmap" icon="chart" accent="#8b5cf6" />
              <CardBody>
                <PerformanceHeatmap results={profile.results} />
              </CardBody>
            </Card>
          </div>

          <div className="space-y-3">
            {results.map((result) => {
              const band = cefrBand(result.cefr)
              return (
                <Card key={result.id} className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-4 p-5">
                    <span
                      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: band.color }}
                    >
                      <span className="text-lg font-bold leading-none">{result.cefr}</span>
                      <span className="mt-0.5 text-[10px] font-medium opacity-90">
                        {result.overallScore}%
                      </span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          {result.mode === 'full' ? 'Full Mock Test' : 'Individual Skill Test'}
                        </p>
                        <Badge tone="neutral">{result.difficulty}</Badge>
                        <Badge
                          tone={
                            result.proctor.integrityScore >= 85
                              ? 'success'
                              : result.proctor.integrityScore >= 60
                                ? 'warning'
                                : 'danger'
                          }
                          icon="shield"
                        >
                          Integrity {result.proctor.integrityScore}%
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(result.completedAt)}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-3">
                        {SKILLS.filter((skill) => result[skill]).map((skill) => (
                          <span key={skill} className="flex items-center gap-1.5 text-xs">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: SKILL_ACCENTS[skill] }}
                            />
                            <span className="text-slate-500 dark:text-slate-400">
                              {SKILL_LABELS[skill]}
                            </span>
                            <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                              {result[skill]?.score}%
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon="eye"
                        onClick={() => navigate(`/results/${result.id}`)}
                      >
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="download"
                        onClick={() => downloadReport(result)}
                      >
                        PDF
                      </Button>
                      <button
                        type="button"
                        aria-label="Delete this attempt"
                        onClick={() => setPendingDelete(result.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Modal
        open={!!pendingDelete}
        title="Delete this attempt?"
        tone="danger"
        onClose={() => setPendingDelete(null)}
        description="The scores, answers and any speaking recordings for this attempt will be permanently removed."
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                if (pendingDelete) deleteResult(pendingDelete)
                setPendingDelete(null)
              }}
            >
              Delete
            </Button>
          </>
        }
      />

      <Modal
        open={confirmReset}
        title="Clear all stored data?"
        tone="danger"
        onClose={() => setConfirmReset(false)}
        description="This removes every test result, achievement, streak and recording from this device. It cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                resetProfile()
                setConfirmReset(false)
              }}
            >
              Delete Everything
            </Button>
          </>
        }
      />
    </div>
  )
}
