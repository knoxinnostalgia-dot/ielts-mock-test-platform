import type { Difficulty, SpeakingTaskSet } from '@/types'

/**
 * Speaking content. Repeat-sentence prompts are delivered through the same
 * clip engine as the listening module, so the two-play limit applies here too.
 */
export const SPEAKING_TASK_SETS: SpeakingTaskSet[] = [
  {
    id: 'speaking-beginner',
    difficulty: 'beginner',
    repeatSentences: [
      {
        id: 'sb-r1',
        text: 'The train to the airport leaves from platform nine.',
        audioSrc: '/audio/sb-r1.mp3',
        recordSeconds: 12,
      },
      {
        id: 'sb-r2',
        text: 'She usually walks to work when the weather is good.',
        audioSrc: '/audio/sb-r2.mp3',
        recordSeconds: 12,
      },
      {
        id: 'sb-r3',
        text: 'Please remember to bring your identity card to the interview.',
        audioSrc: '/audio/sb-r3.mp3',
        recordSeconds: 12,
      },
      {
        id: 'sb-r4',
        text: 'The library closes early on Friday afternoon during the summer.',
        audioSrc: '/audio/sb-r4.mp3',
        recordSeconds: 12,
      },
    ],
    cueCard: {
      id: 'sb-cue',
      title: 'Part 2 \u2014 Cue Card',
      prompt: 'Describe a memorable journey you took.',
      bullets: [
        'where you went and who you travelled with',
        'how you travelled and how long it took',
        'what happened during the journey',
        'and explain why you still remember it',
      ],
      prepSeconds: 30,
      minSpeakSeconds: 20,
      maxSpeakSeconds: 40,
    },
  },
  {
    id: 'speaking-intermediate',
    difficulty: 'intermediate',
    repeatSentences: [
      {
        id: 'si-r1',
        text: 'Researchers found that the results were consistent across every region they studied.',
        audioSrc: '/audio/si-r1.mp3',
        recordSeconds: 14,
      },
      {
        id: 'si-r2',
        text: 'The committee postponed the decision until the financial report becomes available.',
        audioSrc: '/audio/si-r2.mp3',
        recordSeconds: 14,
      },
      {
        id: 'si-r3',
        text: 'Improving public transport would reduce congestion more effectively than widening roads.',
        audioSrc: '/audio/si-r3.mp3',
        recordSeconds: 14,
      },
      {
        id: 'si-r4',
        text: 'Most participants reported a noticeable improvement within the first three weeks.',
        audioSrc: '/audio/si-r4.mp3',
        recordSeconds: 14,
      },
    ],
    cueCard: {
      id: 'si-cue',
      title: 'Part 2 \u2014 Cue Card',
      prompt: 'Describe a skill you learned that took a long time to master.',
      bullets: [
        'what the skill was and why you decided to learn it',
        'how you practised and what was difficult',
        'how long it took before you felt confident',
        'and explain how the skill has been useful to you',
      ],
      prepSeconds: 30,
      minSpeakSeconds: 20,
      maxSpeakSeconds: 40,
    },
  },
  {
    id: 'speaking-advanced',
    difficulty: 'advanced',
    repeatSentences: [
      {
        id: 'sa-r1',
        text: 'The correlation observed in the pilot study disappeared once the sample was properly stratified.',
        audioSrc: '/audio/sa-r1.mp3',
        recordSeconds: 15,
      },
      {
        id: 'sa-r2',
        text: 'Policymakers rarely acknowledge the trade-off between short-term relief and long-term structural reform.',
        audioSrc: '/audio/sa-r2.mp3',
        recordSeconds: 15,
      },
      {
        id: 'sa-r3',
        text: 'Her argument rests on an assumption that the author never explicitly defends.',
        audioSrc: '/audio/sa-r3.mp3',
        recordSeconds: 15,
      },
      {
        id: 'sa-r4',
        text: 'Sustained investment in preventative care consistently outperforms emergency intervention on every measure.',
        audioSrc: '/audio/sa-r4.mp3',
        recordSeconds: 15,
      },
    ],
    cueCard: {
      id: 'sa-cue',
      title: 'Part 2 \u2014 Cue Card',
      prompt: 'Describe a decision you made that you would make differently today.',
      bullets: [
        'what the decision was and when you made it',
        'what information you had at the time',
        'what you would change and why',
        'and explain what the experience taught you',
      ],
      prepSeconds: 30,
      minSpeakSeconds: 20,
      maxSpeakSeconds: 40,
    },
  },
]

export function getSpeakingTaskSet(id: string): SpeakingTaskSet {
  return SPEAKING_TASK_SETS.find((set) => set.id === id) ?? SPEAKING_TASK_SETS[0]
}

export function speakingTaskSetForDifficulty(difficulty: Difficulty): SpeakingTaskSet {
  return (
    SPEAKING_TASK_SETS.find((set) => set.difficulty === difficulty) ?? SPEAKING_TASK_SETS[1]
  )
}
