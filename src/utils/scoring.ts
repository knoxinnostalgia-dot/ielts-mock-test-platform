import { buildRecommendation } from '@/data/recommendations'
import { getListeningSection } from '@/data/listeningSections'
import { getReadingPassage } from '@/data/readingPassages'
import { getSpeakingTaskSet } from '@/data/speakingTasks'
import { getWritingPrompt } from '@/data/writingPrompts'
import type {
  AnalyticsMetric,
  ChoiceReviewItem,
  IntegrityEvent,
  ListeningResult,
  ListeningState,
  ProctorSummary,
  Question,
  ReadingResult,
  ReadingState,
  Recommendation,
  SectionFeedback,
  SkillId,
  SpeakingResult,
  SpeakingState,
  TestResult,
  TestSession,
  WritingResult,
  WritingState,
} from '@/types'
import { scoreToCEFR } from './cefr'
import { INTEGRITY_PENALTIES, MODULE_SECONDS } from './constants'
import { htmlToPlainText } from './html'
import { createId } from './id'
import { analyzeText, clamp, percent } from './text'

export function emptyProctorSummary(): ProctorSummary {
  return {
    events: [],
    focusViolations: 0,
    tabSwitches: 0,
    fullscreenExits: 0,
    faceLostCount: 0,
    multipleFaceCount: 0,
    headTurnCount: 0,
    gazeDeviationCount: 0,
    longAbsenceCount: 0,
    secondsWithoutFace: 0,
    monitoredSeconds: 0,
    cameraGranted: false,
    integrityScore: 100,
  }
}

export function applyIntegrityEvent(
  summary: ProctorSummary,
  event: IntegrityEvent,
): ProctorSummary {
  const next: ProctorSummary = {
    ...summary,
    events: [...summary.events, event].slice(-400),
  }
  switch (event.type) {
    case 'tab-switch':
      next.tabSwitches += 1
      next.focusViolations += 1
      break
    case 'window-blur':
      next.focusViolations += 1
      break
    case 'fullscreen-exit':
      next.fullscreenExits += 1
      next.focusViolations += 1
      break
    case 'face-lost':
      next.faceLostCount += 1
      break
    case 'multiple-faces':
      next.multipleFaceCount += 1
      break
    case 'head-turn':
      next.headTurnCount += 1
      break
    case 'gaze-deviation':
      next.gazeDeviationCount += 1
      break
    case 'long-absence':
      next.longAbsenceCount += 1
      break
    default:
      break
  }
  next.integrityScore = computeIntegrityScore(next)
  return next
}

/**
 * Integrity is advisory only — it never fails a candidate, it only produces a
 * transparent 0-100 figure backed by the timestamped event log.
 */
export function computeIntegrityScore(summary: ProctorSummary): number {
  let deduction = 0
  deduction += summary.tabSwitches * INTEGRITY_PENALTIES['tab-switch']
  deduction +=
    Math.max(0, summary.focusViolations - summary.tabSwitches - summary.fullscreenExits) *
    INTEGRITY_PENALTIES['window-blur']
  deduction += summary.fullscreenExits * INTEGRITY_PENALTIES['fullscreen-exit']
  deduction += summary.faceLostCount * INTEGRITY_PENALTIES['face-lost']
  deduction += summary.multipleFaceCount * INTEGRITY_PENALTIES['multiple-faces']
  deduction += summary.headTurnCount * INTEGRITY_PENALTIES['head-turn']
  deduction += summary.gazeDeviationCount * INTEGRITY_PENALTIES['gaze-deviation']
  deduction += summary.longAbsenceCount * INTEGRITY_PENALTIES['long-absence']

  if (summary.monitoredSeconds > 0) {
    const absenceRatio = summary.secondsWithoutFace / summary.monitoredSeconds
    deduction += clamp(absenceRatio * 40, 0, 25)
  }

  return clamp(Math.round(100 - deduction), 0, 100)
}

/* ------------------------------------------------------------------ */
/* Choice-based sections                                               */
/* ------------------------------------------------------------------ */

function buildReview(questions: Question[], answers: Record<string, number>): ChoiceReviewItem[] {
  return questions.map((question) => {
    const selected = answers[question.id]
    const selectedIndex = typeof selected === 'number' ? selected : null
    return {
      questionId: question.id,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
      selectedIndex,
      correct: selectedIndex === question.correctIndex,
      explanation: question.explanation,
    }
  })
}

function accuracyByType(
  review: ChoiceReviewItem[],
  types: string[],
): { value: number; correct: number; total: number } {
  const subset = review.filter((item) => types.includes(item.type))
  const correct = subset.filter((item) => item.correct).length
  return { value: percent(correct, subset.length), correct, total: subset.length }
}

function metric(label: string, stats: { value: number; correct: number; total: number }): AnalyticsMetric {
  return {
    label,
    value: stats.value,
    detail: stats.total === 0 ? 'Not assessed' : `${stats.correct} of ${stats.total} correct`,
  }
}

function feedbackFromMetrics(
  metrics: AnalyticsMetric[],
  strongTemplate: (label: string) => string,
  weakTemplate: (label: string) => string,
): SectionFeedback {
  const assessed = metrics.filter((item) => !item.detail.startsWith('Not assessed'))
  const sorted = [...assessed].sort((a, b) => b.value - a.value)
  const strengths = sorted.filter((item) => item.value >= 70).slice(0, 2).map((item) => strongTemplate(item.label))
  const improvements = [...sorted]
    .reverse()
    .filter((item) => item.value < 70)
    .slice(0, 2)
    .map((item) => weakTemplate(item.label))
  if (strengths.length === 0 && sorted.length > 0) {
    strengths.push(`Best performance was in ${sorted[0].label.toLowerCase()} at ${sorted[0].value}%.`)
  }
  if (improvements.length === 0) {
    improvements.push('Performance was consistent across every question type — increase difficulty next.')
  }
  return { strengths, improvements }
}

export function scoreReading(state: ReadingState): ReadingResult {
  const passage = getReadingPassage(state.passageId)
  const review = buildReview(passage.questions, state.answers)
  const correct = review.filter((item) => item.correct).length
  const total = review.length

  const metrics: AnalyticsMetric[] = [
    metric('Main Idea Accuracy', accuracyByType(review, ['main-idea'])),
    metric('Inference Accuracy', accuracyByType(review, ['inference'])),
    metric('Summary Accuracy', accuracyByType(review, ['summary'])),
    metric('True/False/Not Given Accuracy', accuracyByType(review, ['tfng'])),
    metric('Multiple Choice Accuracy', accuracyByType(review, ['mcq'])),
  ]

  return {
    score: percent(correct, total),
    correct,
    total,
    passageId: passage.id,
    passageTitle: passage.title,
    metrics,
    feedback: feedbackFromMetrics(
      metrics,
      (label) => `Reliable on ${label.replace(' Accuracy', '').toLowerCase()} questions.`,
      (label) => `Target ${label.replace(' Accuracy', '').toLowerCase()} questions in your next practice block.`,
    ),
    review,
    timeSpentSeconds: MODULE_SECONDS - state.secondsRemaining,
  }
}

export function scoreListening(state: ListeningState): ListeningResult {
  const section = getListeningSection(state.sectionId)
  const review = buildReview(section.questions, state.answers)
  const correct = review.filter((item) => item.correct).length
  const total = review.length
  const replaysUsed = Object.values(state.playCounts).reduce(
    (sum, count) => sum + Math.max(0, count - 1),
    0,
  )

  const metrics: AnalyticsMetric[] = [
    metric('Detail Questions Accuracy', accuracyByType(review, ['detail'])),
    metric('Main Idea Accuracy', accuracyByType(review, ['main-idea'])),
    metric('Vocabulary Recognition', accuracyByType(review, ['vocabulary'])),
    metric('Context Understanding', accuracyByType(review, ['context'])),
  ]

  return {
    score: percent(correct, total),
    correct,
    total,
    sectionId: section.id,
    sectionTitle: section.title,
    metrics,
    feedback: feedbackFromMetrics(
      metrics,
      (label) => `Strong ${label.replace(' Accuracy', '').toLowerCase()} when listening.`,
      (label) => `Work on ${label.replace(' Accuracy', '').toLowerCase()} with short recordings.`,
    ),
    review,
    replaysUsed,
    timeSpentSeconds: MODULE_SECONDS - state.secondsRemaining,
  }
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export function scoreWriting(state: WritingState): WritingResult {
  const prompt = getWritingPrompt(state.promptId)
  const plainText = htmlToPlainText(state.text)
  const stats = analyzeText(plainText)
  const withinRange = stats.wordCount >= prompt.minWords && stats.wordCount <= prompt.maxWords

  // Word count compliance — 40 points, tapering as the response drifts outside the band.
  let compliance = 40
  if (!withinRange) {
    const distance =
      stats.wordCount < prompt.minWords
        ? prompt.minWords - stats.wordCount
        : stats.wordCount - prompt.maxWords
    compliance = clamp(40 - distance * 0.8, 0, 40)
  }

  // Completion — 20 points for producing a genuinely developed response.
  const completion =
    (stats.wordCount > 0 ? 6 : 0) +
    (stats.sentenceCount >= 4 ? 7 : stats.sentenceCount * 1.75) +
    (stats.paragraphCount >= 2 ? 7 : 0)

  // Sentence variety — 15 points from length spread and a sensible average length.
  const varietyScore = clamp((stats.sentenceLengthVariety / 7) * 9, 0, 9)
  const lengthScore = stats.averageSentenceLength >= 10 && stats.averageSentenceLength <= 24 ? 6 : 3
  const variety = stats.sentenceCount >= 2 ? varietyScore + lengthScore : 0

  // Paragraph structure — 15 points.
  const paragraphScore =
    (stats.paragraphCount >= 3 ? 9 : stats.paragraphCount === 2 ? 6 : 2) +
    clamp(stats.connectiveCount * 1.5, 0, 6)

  // Vocabulary diversity — 10 points.
  const vocabulary = clamp((stats.uniqueWordRatio - 0.35) * 40, 0, 7) + clamp(stats.academicWordCount, 0, 3)

  const score = clamp(
    Math.round(compliance + completion + variety + paragraphScore + vocabulary),
    0,
    100,
  )

  const metrics: AnalyticsMetric[] = [
    {
      label: 'Word Count Compliance',
      value: Math.round((compliance / 40) * 100),
      detail: `${stats.wordCount} words (target ${prompt.minWords}\u2013${prompt.maxWords})`,
    },
    {
      label: 'Sentence Variety',
      value: Math.round((variety / 15) * 100),
      detail: `${stats.sentenceCount} sentences, average ${stats.averageSentenceLength.toFixed(1)} words`,
    },
    {
      label: 'Paragraph Structure',
      value: Math.round((paragraphScore / 15) * 100),
      detail: `${stats.paragraphCount} paragraph${stats.paragraphCount === 1 ? '' : 's'}, ${stats.connectiveCount} linking expressions`,
    },
    {
      label: 'Vocabulary Diversity',
      value: Math.round((vocabulary / 10) * 100),
      detail: `${Math.round(stats.uniqueWordRatio * 100)}% unique words, ${stats.academicWordCount} academic terms`,
    },
  ]

  const strengths: string[] = []
  const improvements: string[] = []

  if (withinRange) strengths.push('Response length met the task requirement precisely.')
  else if (stats.wordCount < prompt.minWords)
    improvements.push(
      `Response was ${prompt.minWords - stats.wordCount} words short of the ${prompt.minWords}-word minimum.`,
    )
  else
    improvements.push(
      `Response exceeded the ${prompt.maxWords}-word maximum by ${stats.wordCount - prompt.maxWords} words.`,
    )

  if (stats.paragraphCount >= 3) strengths.push('Strong paragraph organisation with clear separation of ideas.')
  else improvements.push('Break the response into at least three paragraphs with one idea each.')

  if (stats.sentenceLengthVariety >= 5) strengths.push('Good control of sentence rhythm and length variation.')
  else improvements.push('Use more varied sentence structures — mix short statements with complex sentences.')

  if (stats.uniqueWordRatio >= 0.55) strengths.push('Wide lexical range with little repetition.')
  else improvements.push('Reduce word repetition by choosing more precise alternatives.')

  if (stats.connectiveCount >= 3) strengths.push('Effective use of linking expressions to guide the reader.')

  return {
    score,
    promptId: prompt.id,
    promptTitle: prompt.title,
    category: prompt.category,
    text: plainText,
    wordCount: stats.wordCount,
    minWords: prompt.minWords,
    maxWords: prompt.maxWords,
    withinRange,
    sentenceCount: stats.sentenceCount,
    paragraphCount: stats.paragraphCount,
    uniqueWordRatio: stats.uniqueWordRatio,
    averageSentenceLength: stats.averageSentenceLength,
    metrics,
    feedback: {
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 3),
    },
    timeSpentSeconds: MODULE_SECONDS - state.secondsRemaining,
  }
}

/* ------------------------------------------------------------------ */
/* Speaking                                                            */
/* ------------------------------------------------------------------ */

export function scoreSpeaking(state: SpeakingState): SpeakingResult {
  const taskSet = getSpeakingTaskSet(state.taskSetId)
  const repeatTotal = taskSet.repeatSentences.length
  const repeatRecordings = state.repeatRecordings
  const completedRepeats = taskSet.repeatSentences.filter(
    (task) => (repeatRecordings[task.id]?.durationSeconds ?? 0) >= 1,
  )
  const repeatCompleted = completedRepeats.length

  const cueCardRecording = state.cueCardRecording
  const cueCardDuration = cueCardRecording?.durationSeconds ?? 0
  const { minSpeakSeconds, maxSpeakSeconds } = taskSet.cueCard
  const cueCardWithinWindow =
    cueCardDuration >= minSpeakSeconds && cueCardDuration <= maxSpeakSeconds + 2

  // Recording completion — 40 points across part 1, 25 for the cue card.
  const repeatCompletion = repeatTotal > 0 ? (repeatCompleted / repeatTotal) * 40 : 0
  const cueCompletion = cueCardDuration >= 3 ? 25 : cueCardDuration > 0 ? 10 : 0

  // Timing compliance — 20 points.
  let timing = 0
  if (cueCardDuration > 0) {
    if (cueCardWithinWindow) timing = 20
    else if (cueCardDuration < minSpeakSeconds)
      timing = clamp((cueCardDuration / minSpeakSeconds) * 20, 0, 18)
    else timing = 14
  }

  // Fluency estimate — 15 points from how fully each recording window was used.
  const expectedRepeatSeconds = taskSet.repeatSentences.reduce(
    (sum, task) => sum + Math.min(task.recordSeconds, 6),
    0,
  )
  const actualRepeatSeconds = completedRepeats.reduce(
    (sum, task) => sum + (repeatRecordings[task.id]?.durationSeconds ?? 0),
    0,
  )
  const usageRatio = expectedRepeatSeconds > 0 ? actualRepeatSeconds / expectedRepeatSeconds : 0
  const fluency = clamp(usageRatio * 15, 0, 15)

  const score = clamp(Math.round(repeatCompletion + cueCompletion + timing + fluency), 0, 100)
  const totalSpokenSeconds = actualRepeatSeconds + cueCardDuration

  const metrics: AnalyticsMetric[] = [
    {
      label: 'Recording Completion',
      value: percent(repeatCompleted + (cueCardDuration >= 3 ? 1 : 0), repeatTotal + 1),
      detail: `${repeatCompleted}/${repeatTotal} repeat tasks + ${cueCardDuration >= 3 ? 1 : 0}/1 cue card`,
    },
    {
      label: 'Speaking Duration',
      value: Math.round((timing / 20) * 100),
      detail:
        cueCardDuration > 0
          ? `Cue card ${cueCardDuration.toFixed(1)}s (target ${minSpeakSeconds}\u2013${maxSpeakSeconds}s)`
          : 'No cue card recording captured',
    },
    {
      label: 'Fluency Estimate',
      value: Math.round((fluency / 15) * 100),
      detail: `${totalSpokenSeconds.toFixed(1)}s of speech captured in total`,
    },
    {
      label: 'Response Completeness',
      value: percent(
        Math.round(repeatCompletion + cueCompletion),
        65,
      ),
      detail: cueCardWithinWindow ? 'Long-turn response fully developed' : 'Long-turn response was short or missing',
    },
  ]

  const strengths: string[] = []
  const improvements: string[] = []

  if (repeatCompleted === repeatTotal) strengths.push('Every repeat-sentence task was attempted and recorded.')
  else improvements.push(`${repeatTotal - repeatCompleted} repeat-sentence task(s) were left unrecorded.`)

  if (cueCardWithinWindow) strengths.push('Cue card response fell inside the required timing window.')
  else if (cueCardDuration === 0) improvements.push('No cue card recording was submitted — this costs the most marks.')
  else if (cueCardDuration < minSpeakSeconds)
    improvements.push(`Cue card answer stopped at ${cueCardDuration.toFixed(0)}s; aim for at least ${minSpeakSeconds}s.`)
  else improvements.push('Cue card answer ran past the maximum window — plan a closing sentence.')

  if (usageRatio >= 0.85) strengths.push('Recording windows were used confidently with little hesitation.')
  else improvements.push('Begin speaking immediately when recording starts to reduce dead air.')

  return {
    score,
    taskSetId: taskSet.id,
    repeatCompleted,
    repeatTotal,
    repeatRecordings,
    cueCardRecording,
    cueCardDuration,
    cueCardWithinWindow,
    totalSpokenSeconds,
    metrics,
    feedback: {
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 3),
    },
    timeSpentSeconds: MODULE_SECONDS - state.secondsRemaining,
  }
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

function collectRecommendations(result: {
  reading: ReadingResult | null
  listening: ListeningResult | null
  writing: WritingResult | null
  speaking: SpeakingResult | null
  proctor: ProctorSummary
  difficulty: TestSession['difficulty']
}): Recommendation[] {
  const keys: string[] = []

  const weakest = (metrics: AnalyticsMetric[]) =>
    [...metrics]
      .filter((item) => !item.detail.startsWith('Not assessed'))
      .sort((a, b) => a.value - b.value)[0]

  if (result.reading) {
    const worst = weakest(result.reading.metrics)
    const map: Record<string, string> = {
      'Main Idea Accuracy': 'reading:main-idea',
      'Inference Accuracy': 'reading:inference',
      'Summary Accuracy': 'reading:summary',
      'True/False/Not Given Accuracy': 'reading:tfng',
      'Multiple Choice Accuracy': 'reading:inference',
    }
    if (worst && worst.value < 85) keys.push(map[worst.label] ?? 'reading:speed')
    else keys.push('reading:speed')
  }

  if (result.listening) {
    const worst = weakest(result.listening.metrics)
    const map: Record<string, string> = {
      'Detail Questions Accuracy': 'listening:detail',
      'Main Idea Accuracy': 'listening:main-idea',
      'Vocabulary Recognition': 'listening:vocabulary',
      'Context Understanding': 'listening:context',
    }
    if (worst && worst.value < 85) keys.push(map[worst.label] ?? 'listening:replays')
    if (result.listening.replaysUsed >= 2) keys.push('listening:replays')
  }

  if (result.writing) {
    const worst = weakest(result.writing.metrics)
    const map: Record<string, string> = {
      'Word Count Compliance': 'writing:length',
      'Sentence Variety': 'writing:variety',
      'Paragraph Structure': 'writing:structure',
      'Vocabulary Diversity': 'writing:vocabulary',
    }
    if (worst) keys.push(map[worst.label] ?? 'writing:structure')
  }

  if (result.speaking) {
    const worst = weakest(result.speaking.metrics)
    const map: Record<string, string> = {
      'Recording Completion': 'speaking:completion',
      'Speaking Duration': 'speaking:duration',
      'Fluency Estimate': 'speaking:fluency',
      'Response Completeness': 'speaking:completeness',
    }
    if (worst) keys.push(map[worst.label] ?? 'speaking:fluency')
  }

  if (result.proctor.focusViolations > 0) keys.push('integrity:focus')

  const unique = [...new Set(keys)]
  return unique
    .map((key, index) => buildRecommendation(key, result.difficulty, index))
    .filter((item): item is Recommendation => item !== null)
    .slice(0, 4)
}

export function buildResult(session: TestSession): TestResult {
  const reading = session.reading ? scoreReading(session.reading) : null
  const listening = session.listening ? scoreListening(session.listening) : null
  const writing = session.writing ? scoreWriting(session.writing) : null
  const speaking = session.speaking ? scoreSpeaking(session.speaking) : null

  const scores: { skill: SkillId; score: number }[] = []
  if (listening) scores.push({ skill: 'listening', score: listening.score })
  if (reading) scores.push({ skill: 'reading', score: reading.score })
  if (writing) scores.push({ skill: 'writing', score: writing.score })
  if (speaking) scores.push({ skill: 'speaking', score: speaking.score })

  const overallScore = scores.length
    ? Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length)
    : 0

  const proctor: ProctorSummary = {
    ...session.proctor,
    integrityScore: computeIntegrityScore(session.proctor),
  }

  const sorted = [...scores].sort((a, b) => b.score - a.score)
  const strengths: string[] = []
  const weaknesses: string[] = []

  const allFeedback = [reading, listening, writing, speaking].filter(Boolean) as {
    feedback: SectionFeedback
  }[]
  allFeedback.forEach((section) => {
    strengths.push(...section.feedback.strengths)
    weaknesses.push(...section.feedback.improvements)
  })

  if (sorted.length > 1) {
    strengths.unshift(
      `Strongest module: ${sorted[0].skill} at ${sorted[0].score}%.`,
    )
    weaknesses.unshift(
      `Weakest module: ${sorted[sorted.length - 1].skill} at ${sorted[sorted.length - 1].score}%.`,
    )
  }

  return {
    id: createId('result'),
    sessionId: session.id,
    candidateName: session.candidateName,
    mode: session.mode,
    difficulty: session.difficulty,
    completedAt: Date.now(),
    skills: scores.map((item) => item.skill),
    overallScore,
    cefr: scoreToCEFR(overallScore),
    reading,
    listening,
    writing,
    speaking,
    proctor,
    strengths: [...new Set(strengths)].slice(0, 5),
    weaknesses: [...new Set(weaknesses)].slice(0, 5),
    recommendations: collectRecommendations({
      reading,
      listening,
      writing,
      speaking,
      proctor,
      difficulty: session.difficulty,
    }),
  }
}

export function recordingIdsFromResult(result: TestResult): string[] {
  if (!result.speaking) return []
  const ids = Object.values(result.speaking.repeatRecordings).map((item) => item.id)
  if (result.speaking.cueCardRecording) ids.push(result.speaking.cueCardRecording.id)
  return ids
}
