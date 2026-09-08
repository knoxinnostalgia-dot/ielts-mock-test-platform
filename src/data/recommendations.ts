import type { Difficulty, Recommendation, SkillId } from '@/types'

export interface RecommendationTemplate {
  key: string
  skill: SkillId
  title: string
  focus: string
  description: string
  estimatedMinutes: number
}

/**
 * Catalogue of follow-up activities. The scoring engine picks entries whose
 * key matches the candidate's weakest analytics metric.
 */
export const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  {
    key: 'reading:inference',
    skill: 'reading',
    title: 'Reading Inference Questions',
    focus: 'Inference',
    description:
      'Practise separating what a passage states from what it implies. Underline the exact phrase that licenses each inference before choosing an option.',
    estimatedMinutes: 15,
  },
  {
    key: 'reading:main-idea',
    skill: 'reading',
    title: 'Paragraph Main Idea Drills',
    focus: 'Main idea',
    description:
      'Read each paragraph and write a six-word summary before looking at the options. Compare your summary with the answer key.',
    estimatedMinutes: 12,
  },
  {
    key: 'reading:tfng',
    skill: 'reading',
    title: 'True / False / Not Given Accuracy',
    focus: 'True / False / Not Given',
    description:
      'Focus on the difference between contradicted and simply absent information. Not Given means the passage is silent, not that the claim is unlikely.',
    estimatedMinutes: 15,
  },
  {
    key: 'reading:summary',
    skill: 'reading',
    title: 'Summary Completion Practice',
    focus: 'Summary completion',
    description:
      'Predict the part of speech each gap needs before reading the word bank, then scan the passage for the paraphrase rather than the exact word.',
    estimatedMinutes: 12,
  },
  {
    key: 'reading:speed',
    skill: 'reading',
    title: 'Timed Skimming Practice',
    focus: 'Pacing',
    description:
      'Read three passages with a strict four-minute skim before answering. Build the habit of mapping a text before mining it.',
    estimatedMinutes: 20,
  },
  {
    key: 'listening:detail',
    skill: 'listening',
    title: 'Listening for Specific Detail',
    focus: 'Detail questions',
    description:
      'Practise catching numbers, times and names on a single pass. Note the question keywords before the recording begins.',
    estimatedMinutes: 15,
  },
  {
    key: 'listening:main-idea',
    skill: 'listening',
    title: 'Gist and Purpose Listening',
    focus: 'Main idea',
    description:
      'Listen to short monologues and state the speaker\u2019s purpose in one sentence before checking the options.',
    estimatedMinutes: 12,
  },
  {
    key: 'listening:vocabulary',
    skill: 'listening',
    title: 'Vocabulary Recognition in Speech',
    focus: 'Vocabulary',
    description:
      'Work on recognising academic words when spoken quickly, including reduced forms and unfamiliar accents.',
    estimatedMinutes: 15,
  },
  {
    key: 'listening:context',
    skill: 'listening',
    title: 'Inference From Context',
    focus: 'Context understanding',
    description:
      'Practise inferring reason and attitude from tone and phrasing rather than from explicit statements.',
    estimatedMinutes: 15,
  },
  {
    key: 'listening:replays',
    skill: 'listening',
    title: 'Single-Play Listening Discipline',
    focus: 'First-pass accuracy',
    description:
      'Answer a full section using only one play. Real exams allow no replay, so build accuracy on the first pass.',
    estimatedMinutes: 20,
  },
  {
    key: 'writing:length',
    skill: 'writing',
    title: 'Word Count Control',
    focus: 'Task compliance',
    description:
      'Draft three responses of exactly 140 words. Learning the physical length of a compliant answer removes the need to count under pressure.',
    estimatedMinutes: 15,
  },
  {
    key: 'writing:variety',
    skill: 'writing',
    title: 'Sentence Variety Workshop',
    focus: 'Sentence structure',
    description:
      'Rewrite a paragraph three ways: with a subordinate clause first, with a participle opener, and as two short sentences.',
    estimatedMinutes: 18,
  },
  {
    key: 'writing:structure',
    skill: 'writing',
    title: 'Paragraph Architecture',
    focus: 'Organisation',
    description:
      'Practise one idea per paragraph with an explicit topic sentence, supporting detail and a closing link.',
    estimatedMinutes: 15,
  },
  {
    key: 'writing:vocabulary',
    skill: 'writing',
    title: 'Lexical Range Builder',
    focus: 'Vocabulary diversity',
    description:
      'Identify repeated words in your last response and replace each with a precise alternative rather than a generic synonym.',
    estimatedMinutes: 12,
  },
  {
    key: 'speaking:completion',
    skill: 'speaking',
    title: 'Complete Every Speaking Task',
    focus: 'Task completion',
    description:
      'Record all repeat-sentence items in one sitting without skipping. Unattempted items cost more marks than imperfect ones.',
    estimatedMinutes: 10,
  },
  {
    key: 'speaking:duration',
    skill: 'speaking',
    title: 'Cue Card Timing Control',
    focus: 'Timing compliance',
    description:
      'Rehearse speaking for a full 35 seconds without stopping early. Use the 30-second preparation window to note four bullet points.',
    estimatedMinutes: 15,
  },
  {
    key: 'speaking:fluency',
    skill: 'speaking',
    title: 'Fluency and Continuity',
    focus: 'Fluency',
    description:
      'Practise speaking continuously with no pause longer than two seconds. Record and count your hesitations.',
    estimatedMinutes: 18,
  },
  {
    key: 'speaking:completeness',
    skill: 'speaking',
    title: 'Covering All Cue Card Points',
    focus: 'Response completeness',
    description:
      'Structure your answer so that each bullet on the cue card receives at least one full sentence.',
    estimatedMinutes: 12,
  },
  {
    key: 'integrity:focus',
    skill: 'reading',
    title: 'Exam Environment Discipline',
    focus: 'Test conditions',
    description:
      'Sit your next practice test in fullscreen with notifications disabled and nobody else in the room. Focus violations are recorded on the final report.',
    estimatedMinutes: 5,
  },
]

export function buildRecommendation(
  key: string,
  difficulty: Difficulty,
  index: number,
): Recommendation | null {
  const template = RECOMMENDATION_TEMPLATES.find((item) => item.key === key)
  if (!template) return null
  return {
    id: `${key}-${index}`,
    title: template.title,
    focus: template.focus,
    description: template.description,
    estimatedMinutes: template.estimatedMinutes,
    difficulty,
    skill: template.skill,
  }
}
