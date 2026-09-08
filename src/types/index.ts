/** Core domain model for the IELTS Mock Test Platform. */

export const SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const
export type SkillId = (typeof SKILLS)[number]

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export type TestMode = 'full' | 'single'

/** Question taxonomy — drives both rendering and the per-skill analytics breakdown. */
export type ReadingQuestionType = 'tfng' | 'summary' | 'main-idea' | 'inference' | 'mcq'
export type ListeningQuestionType = 'detail' | 'main-idea' | 'vocabulary' | 'context'
export type QuestionType = ReadingQuestionType | ListeningQuestionType

export interface Question {
  id: string
  type: QuestionType
  /** Question stem. For summary gaps this is the sentence containing the blank. */
  prompt: string
  options: string[]
  correctIndex: number
  /** Shown on the results review screen. */
  explanation: string
  /** Optional grouping label rendered above the first question of a run. */
  groupLabel?: string
}

export interface ReadingParagraph {
  label: string
  text: string
}

export interface ReadingPassage {
  id: string
  difficulty: Difficulty
  title: string
  subtitle: string
  source: string
  wordCount: number
  paragraphs: ReadingParagraph[]
  /** Cloze paragraph rendered above the summary-completion questions. */
  summaryTask: {
    title: string
    text: string
  }
  questions: Question[]
}

export interface ListeningClip {
  id: string
  title: string
  speakerLabel: string
  /** Optional file in /public/audio; falls back to speech synthesis of `transcript`. */
  audioSrc?: string
  transcript: string
  /** Approximate seconds, used for the progress bar before playback starts. */
  estimatedSeconds: number
}

export interface ListeningSection {
  id: string
  difficulty: Difficulty
  title: string
  subtitle: string
  clips: ListeningClip[]
  /** Maps each question to the clip it belongs to. */
  questions: (Question & { clipId: string })[]
}

export type WritingCategory = 'opinion' | 'argumentative' | 'expository' | 'descriptive'

export interface WritingPrompt {
  id: string
  difficulty: Difficulty
  category: WritingCategory
  title: string
  prompt: string
  instructions: string[]
  minWords: number
  maxWords: number
  suggestedStructure: string[]
}

export interface RepeatSentenceTask {
  id: string
  text: string
  audioSrc?: string
  /** Seconds the candidate is given to record their repetition. */
  recordSeconds: number
}

export interface CueCardTask {
  id: string
  title: string
  prompt: string
  bullets: string[]
  prepSeconds: number
  minSpeakSeconds: number
  maxSpeakSeconds: number
}

export interface SpeakingTaskSet {
  id: string
  difficulty: Difficulty
  repeatSentences: RepeatSentenceTask[]
  cueCard: CueCardTask
}

/* ------------------------------------------------------------------ */
/* Session state                                                       */
/* ------------------------------------------------------------------ */

export type SectionStatus = 'pending' | 'active' | 'submitted' | 'expired'

export interface ChoiceAnswers {
  /** questionId -> selected option index */
  [questionId: string]: number
}

export interface ReadingState {
  passageId: string
  answers: ChoiceAnswers
  flagged: string[]
  currentIndex: number
  status: SectionStatus
  secondsRemaining: number
  startedAt: number | null
  submittedAt: number | null
}

export interface ListeningState {
  sectionId: string
  answers: ChoiceAnswers
  flagged: string[]
  currentIndex: number
  /** clipId -> number of completed/started plays (hard cap of 2). */
  playCounts: Record<string, number>
  status: SectionStatus
  secondsRemaining: number
  startedAt: number | null
  submittedAt: number | null
}

export interface WritingState {
  promptId: string
  text: string
  status: SectionStatus
  secondsRemaining: number
  startedAt: number | null
  submittedAt: number | null
  lastSavedAt: number | null
}

export interface RecordingMeta {
  /** Key into the IndexedDB blob store. */
  id: string
  durationSeconds: number
  mimeType: string
  createdAt: number
  sizeBytes: number
}

export interface SpeakingState {
  taskSetId: string
  /** repeat-sentence task id -> play count (max 2). */
  playCounts: Record<string, number>
  /** repeat-sentence task id -> recording */
  repeatRecordings: Record<string, RecordingMeta>
  cueCardRecording: RecordingMeta | null
  currentPart: 1 | 2
  currentTaskIndex: number
  status: SectionStatus
  secondsRemaining: number
  startedAt: number | null
  submittedAt: number | null
}

export type IntegrityEventType =
  | 'face-lost'
  | 'face-returned'
  | 'multiple-faces'
  | 'head-turn'
  | 'gaze-deviation'
  | 'long-absence'
  | 'tab-switch'
  | 'window-blur'
  | 'fullscreen-exit'
  | 'camera-denied'
  | 'monitor-unavailable'

export interface IntegrityEvent {
  id: string
  type: IntegrityEventType
  /** Epoch ms. */
  at: number
  skill: SkillId | null
  message: string
  severity: 'info' | 'warning' | 'critical'
}

export interface ProctorSummary {
  events: IntegrityEvent[]
  focusViolations: number
  tabSwitches: number
  fullscreenExits: number
  faceLostCount: number
  multipleFaceCount: number
  headTurnCount: number
  gazeDeviationCount: number
  longAbsenceCount: number
  /** Seconds of monitored time with no face in frame. */
  secondsWithoutFace: number
  monitoredSeconds: number
  cameraGranted: boolean
  integrityScore: number
}

export interface TestSession {
  id: string
  mode: TestMode
  difficulty: Difficulty
  candidateName: string
  createdAt: number
  /** Rotates writing prompts and other variants across repeat attempts. */
  variantIndex: number
  /** Order of modules for this session. */
  plan: SkillId[]
  activeSkill: SkillId | null
  reading: ReadingState | null
  listening: ListeningState | null
  writing: WritingState | null
  speaking: SpeakingState | null
  proctor: ProctorSummary
  completedAt: number | null
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface AnalyticsMetric {
  label: string
  /** 0-100 */
  value: number
  detail: string
}

export interface SectionFeedback {
  strengths: string[]
  improvements: string[]
}

export interface ChoiceReviewItem {
  questionId: string
  type: QuestionType
  prompt: string
  options: string[]
  correctIndex: number
  selectedIndex: number | null
  correct: boolean
  explanation: string
}

export interface ReadingResult {
  score: number
  correct: number
  total: number
  passageId: string
  passageTitle: string
  metrics: AnalyticsMetric[]
  feedback: SectionFeedback
  review: ChoiceReviewItem[]
  timeSpentSeconds: number
}

export interface ListeningResult {
  score: number
  correct: number
  total: number
  sectionId: string
  sectionTitle: string
  metrics: AnalyticsMetric[]
  feedback: SectionFeedback
  review: ChoiceReviewItem[]
  replaysUsed: number
  timeSpentSeconds: number
}

export interface WritingResult {
  score: number
  promptId: string
  promptTitle: string
  category: WritingCategory
  text: string
  wordCount: number
  minWords: number
  maxWords: number
  withinRange: boolean
  sentenceCount: number
  paragraphCount: number
  uniqueWordRatio: number
  averageSentenceLength: number
  metrics: AnalyticsMetric[]
  feedback: SectionFeedback
  timeSpentSeconds: number
}

export interface SpeakingResult {
  score: number
  taskSetId: string
  repeatCompleted: number
  repeatTotal: number
  repeatRecordings: Record<string, RecordingMeta>
  cueCardRecording: RecordingMeta | null
  cueCardDuration: number
  cueCardWithinWindow: boolean
  totalSpokenSeconds: number
  metrics: AnalyticsMetric[]
  feedback: SectionFeedback
  timeSpentSeconds: number
}

export interface TestResult {
  id: string
  sessionId: string
  candidateName: string
  mode: TestMode
  difficulty: Difficulty
  completedAt: number
  skills: SkillId[]
  overallScore: number
  cefr: CEFRLevel
  reading: ReadingResult | null
  listening: ListeningResult | null
  writing: WritingResult | null
  speaking: SpeakingResult | null
  proctor: ProctorSummary
  strengths: string[]
  weaknesses: string[]
  recommendations: Recommendation[]
}

export interface Recommendation {
  id: string
  title: string
  focus: string
  description: string
  estimatedMinutes: number
  difficulty: Difficulty
  skill: SkillId
}

/* ------------------------------------------------------------------ */
/* Profile / gamification                                              */
/* ------------------------------------------------------------------ */

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface UnlockedAchievement {
  id: string
  unlockedAt: number
}

export interface StreakState {
  current: number
  longest: number
  /** ISO yyyy-mm-dd of the last practice day. */
  lastPracticeDate: string | null
  /** ISO yyyy-mm-dd list, newest last. */
  history: string[]
}

export interface IssuedCertificate {
  id: string
  resultId: string
  candidateName: string
  email: string
  issuedAt: number
  overallScore: number
  cefr: CEFRLevel
  mode: TestMode
  skills: SkillId[]
}

export interface CandidateProfile {
  name: string
  email: string
  /** Set when the candidate signs in to claim a certificate. */
  signedInAt: number | null
  difficulty: Difficulty
  /** Automatically tuned from performance; `difficulty` is the manual override. */
  adaptiveDifficulty: Difficulty
  autoAdapt: boolean
  streak: StreakState
  achievements: UnlockedAchievement[]
  results: TestResult[]
  certificates: IssuedCertificate[]
}
