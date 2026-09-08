import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Feedback'
import { useSession } from '@/context/session'
import type { ExamRuntime } from '@/hooks/useExamRuntime'
import type { SkillId } from '@/types'
import { MODULE_SECONDS, SKILL_ACCENTS, SKILL_LABELS } from '@/utils/constants'
import { formatClock } from '@/utils/time'
import { ExamNavbar } from './ExamNavbar'

interface ExamShellProps {
  skill: SkillId
  runtime: ExamRuntime
  briefingTitle: string
  briefingSubtitle: string
  briefingPoints: string[]
  submitSummary?: ReactNode
  children: ReactNode
}

export function ExamShell({
  skill,
  runtime,
  briefingTitle,
  briefingSubtitle,
  briefingPoints,
  submitSummary,
  children,
}: ExamShellProps) {
  const navigate = useNavigate()
  const { session } = useSession()

  if (!session) return null

  const sectionState = session[skill]
  const resuming = !!sectionState && sectionState.secondsRemaining < MODULE_SECONDS
  const accent = SKILL_ACCENTS[skill]

  return (
    <div className="min-h-screen">
      <ExamNavbar
        skill={skill}
        secondsRemaining={runtime.secondsRemaining}
        overallPercent={runtime.overallPercent}
        sessionStartedAt={session.createdAt}
        timerRunning={runtime.phase === 'active'}
        onExit={runtime.requestExit}
      />

      <main className="mx-auto max-w-[1600px] px-3 pb-10 pt-20 sm:px-5">
        {runtime.phase === 'briefing' ? (
          <div className="mx-auto max-w-2xl animate-slide-up">
            <div className="surface-card overflow-hidden">
              <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${accent}1f`, color: accent }}
                  >
                    <Icon
                      name={
                        skill === 'reading'
                          ? 'book'
                          : skill === 'listening'
                            ? 'headphones'
                            : skill === 'writing'
                              ? 'pen'
                              : 'mic'
                      }
                      size={22}
                    />
                  </span>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                      {briefingTitle}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{briefingSubtitle}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge tone="brand" icon="clock">
                    {resuming
                      ? `${formatClock(sectionState?.secondsRemaining ?? MODULE_SECONDS)} remaining`
                      : '20 minute limit'}
                  </Badge>
                  <Badge tone="info" icon="maximize">
                    Fullscreen required
                  </Badge>
                  {runtime.cameraRequired ? (
                    <Badge tone="purple" icon="camera">
                      Camera monitoring (video only)
                    </Badge>
                  ) : (
                    <Badge tone="purple" icon="mic">
                      Microphone required
                    </Badge>
                  )}
                </div>

                <ul className="mt-6 space-y-2.5">
                  {briefingPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <Icon name="check" size={16} className="mt-0.5 text-emerald-500" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>

                <Alert tone="info" className="mt-6">
                  {runtime.cameraRequired
                    ? 'Your camera is used for face-presence checks only. Video frames are analysed on this device, nothing is uploaded, and no audio is captured during this module.'
                    : 'Your microphone is used to record spoken answers for this module only. Recordings stay on this device and the camera is not used.'}
                </Alert>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    icon="play"
                    loading={runtime.starting}
                    onClick={() => void runtime.begin()}
                    className="flex-1"
                  >
                    {resuming ? 'Resume Section' : `Start ${SKILL_LABELS[skill]} Section`}
                  </Button>
                  <Button size="lg" variant="outline" icon="arrowLeft" onClick={() => navigate('/')}>
                    Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      <Modal
        open={runtime.exitModalOpen}
        title="Exit the test?"
        tone="danger"
        onClose={runtime.cancelExit}
        description={
          <>
            Your progress will be saved. You can return to this section later and continue from{' '}
            <strong className="tabular-nums">{formatClock(runtime.secondsRemaining)}</strong> remaining.
          </>
        }
        footer={
          <>
            <Button variant="outline" onClick={runtime.cancelExit}>
              Cancel
            </Button>
            <Button variant="danger" icon="close" onClick={runtime.confirmExit}>
              Confirm Exit
            </Button>
          </>
        }
      >
        <Alert tone="warning">
          Leaving now records no penalty, but the section timer will resume where you left it.
        </Alert>
      </Modal>

      <Modal
        open={runtime.submitModalOpen}
        title={`Submit the ${SKILL_LABELS[skill].toLowerCase()} section?`}
        onClose={runtime.cancelSubmit}
        description="Once submitted you cannot change your answers for this section."
        footer={
          <>
            <Button variant="outline" onClick={runtime.cancelSubmit}>
              Keep Working
            </Button>
            <Button variant="success" icon="check" onClick={runtime.confirmSubmit}>
              Submit Section
            </Button>
          </>
        }
      >
        {submitSummary}
      </Modal>

      <Modal
        open={runtime.timeUpOpen}
        title="Time is up"
        tone="warning"
        dismissible={false}
        description={`The ${SKILL_LABELS[skill].toLowerCase()} section reached its 20 minute limit and was submitted automatically. Further edits are locked.`}
        footer={
          <Button icon="arrowRight" onClick={runtime.acknowledgeTimeUp}>
            Continue
          </Button>
        }
      />

      <Modal
        open={runtime.fullscreenWarningOpen}
        title="You left fullscreen exam mode"
        tone="warning"
        onClose={runtime.dismissFullscreenWarning}
        description="This has been recorded as an integrity event. You may continue the test, but returning to fullscreen is strongly recommended."
        footer={
          <>
            <Button variant="outline" onClick={runtime.dismissFullscreenWarning}>
              Continue Anyway
            </Button>
            <Button icon="maximize" onClick={runtime.returnToFullscreen}>
              Return to Fullscreen
            </Button>
          </>
        }
      />
    </div>
  )
}
