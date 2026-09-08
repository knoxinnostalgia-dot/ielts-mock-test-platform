import type { Difficulty, WritingCategory, WritingPrompt } from '@/types'

export const WRITING_CATEGORY_LABELS: Record<WritingCategory, string> = {
  opinion: 'Opinion Essay',
  argumentative: 'Argumentative Essay',
  expository: 'Expository Essay',
  descriptive: 'Descriptive Essay',
}

export const WRITING_CATEGORY_BLURB: Record<WritingCategory, string> = {
  opinion: 'State a clear personal position and defend it with reasons and examples.',
  argumentative: 'Weigh both sides of a debate before reaching a reasoned conclusion.',
  expository: 'Explain a process, cause or concept clearly and objectively.',
  descriptive: 'Create a vivid, well-organised picture of a place, person or experience.',
}

/** Every prompt sits inside the 100\u2013180 word band required by the platform. */
export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'writing-beginner-opinion',
    difficulty: 'beginner',
    category: 'opinion',
    title: 'Working from home',
    prompt:
      'Some people believe that employees are more productive when they work from home, while others think an office is necessary for good work. What is your opinion?',
    instructions: [
      'State your opinion clearly in the first paragraph.',
      'Give at least two reasons that support your view.',
      'Include one example from your own experience or knowledge.',
      'Finish with a short conclusion that restates your position.',
    ],
    minWords: 100,
    maxWords: 170,
    suggestedStructure: ['Opinion statement', 'Reason 1 + example', 'Reason 2', 'Conclusion'],
  },
  {
    id: 'writing-beginner-expository',
    difficulty: 'beginner',
    category: 'expository',
    title: 'How to learn a new language',
    prompt:
      'Explain the steps a person should follow when learning a new language as an adult. Describe what they should do first, next and over the long term.',
    instructions: [
      'Organise your answer in a clear sequence of steps.',
      'Use sequencing words such as first, then and finally.',
      'Explain why each step matters.',
      'Keep the tone neutral and factual rather than personal.',
    ],
    minWords: 100,
    maxWords: 170,
    suggestedStructure: ['Introduction', 'First steps', 'Building habits', 'Long-term progress'],
  },
  {
    id: 'writing-beginner-descriptive',
    difficulty: 'beginner',
    category: 'descriptive',
    title: 'A place that feels calm',
    prompt:
      'Describe a place where you feel calm and relaxed. Explain what it looks like, what you can hear there, and why it has this effect on you.',
    instructions: [
      'Describe the place using at least three different senses.',
      'Organise the description logically, not as a list.',
      'Explain the effect the place has on you.',
      'Use varied adjectives rather than repeating the same ones.',
    ],
    minWords: 100,
    maxWords: 160,
    suggestedStructure: ['Introduce the place', 'What you see', 'What you hear and feel', 'Why it matters'],
  },
  {
    id: 'writing-beginner-argumentative',
    difficulty: 'beginner',
    category: 'argumentative',
    title: 'Mobile phones in schools',
    prompt:
      'Some schools ban mobile phones during lessons. Discuss the advantages and disadvantages of this policy and say which side you find more convincing.',
    instructions: [
      'Present at least one advantage and one disadvantage.',
      'Use linking words to signal contrast, such as however or on the other hand.',
      'Reach a clear conclusion at the end.',
      'Avoid using bullet points; write in full paragraphs.',
    ],
    minWords: 110,
    maxWords: 180,
    suggestedStructure: ['Introduction', 'Advantages', 'Disadvantages', 'Your conclusion'],
  },
  {
    id: 'writing-intermediate-opinion',
    difficulty: 'intermediate',
    category: 'opinion',
    title: 'Free public transport',
    prompt:
      'Several cities have made public transport free for all residents, funded through general taxation. To what extent do you agree that this is a good use of public money?',
    instructions: [
      'Take a clear position and maintain it throughout.',
      'Support your view with at least two developed reasons.',
      'Acknowledge one objection and respond to it.',
      'Use precise vocabulary related to transport and public policy.',
    ],
    minWords: 120,
    maxWords: 180,
    suggestedStructure: ['Position', 'Main reason', 'Second reason', 'Counter-argument', 'Conclusion'],
  },
  {
    id: 'writing-intermediate-argumentative',
    difficulty: 'intermediate',
    category: 'argumentative',
    title: 'The four-day working week',
    prompt:
      'Trials of a four-day working week report higher wellbeing but mixed effects on output. Discuss both views and give your own conclusion.',
    instructions: [
      'Devote a paragraph to each side of the debate.',
      'Refer to consequences for both employees and employers.',
      'Signal your own position only after presenting both sides.',
      'Use hedging language such as tends to or is likely to where appropriate.',
    ],
    minWords: 120,
    maxWords: 180,
    suggestedStructure: ['Introduction', 'Case in favour', 'Case against', 'Reasoned conclusion'],
  },
  {
    id: 'writing-intermediate-expository',
    difficulty: 'intermediate',
    category: 'expository',
    title: 'Why cities flood',
    prompt:
      'Explain the main reasons why modern cities flood more easily than the countryside, and outline what can be done to reduce the risk.',
    instructions: [
      'Explain causes before solutions.',
      'Use cause-and-effect language such as leads to or results in.',
      'Include at least two distinct causes.',
      'Keep the register formal and impersonal.',
    ],
    minWords: 120,
    maxWords: 180,
    suggestedStructure: ['Overview', 'Cause 1', 'Cause 2', 'Possible responses'],
  },
  {
    id: 'writing-intermediate-descriptive',
    difficulty: 'intermediate',
    category: 'descriptive',
    title: 'A market at its busiest',
    prompt:
      'Describe a market, station or public square at its busiest moment. Convey the atmosphere as well as the physical details.',
    instructions: [
      'Move through the scene in a deliberate order.',
      'Use concrete detail rather than general statements.',
      'Vary sentence length to control pace.',
      'Close with an impression rather than a summary.',
    ],
    minWords: 110,
    maxWords: 175,
    suggestedStructure: ['Establishing shot', 'Sound and movement', 'A single detail in close-up', 'Closing impression'],
  },
  {
    id: 'writing-advanced-argumentative',
    difficulty: 'advanced',
    category: 'argumentative',
    title: 'Regulating automated decision-making',
    prompt:
      'Automated systems increasingly decide who receives credit, housing or medical priority. Some argue such decisions must always involve a human reviewer. Evaluate this argument and give your own view.',
    instructions: [
      'Define the scope of your argument early.',
      'Evaluate the strongest version of the opposing position.',
      'Distinguish between practical and ethical objections.',
      'Reach a qualified rather than absolute conclusion.',
    ],
    minWords: 130,
    maxWords: 180,
    suggestedStructure: ['Framing', 'Strongest case for review', 'Limits of that case', 'Qualified conclusion'],
  },
  {
    id: 'writing-advanced-opinion',
    difficulty: 'advanced',
    category: 'opinion',
    title: 'Funding the arts',
    prompt:
      'It has been argued that public money spent on the arts would be better directed towards healthcare and education. How far do you agree?',
    instructions: [
      'State the extent of your agreement precisely, not simply yes or no.',
      'Distinguish between different kinds of arts funding.',
      'Support claims with reasoning rather than assertion.',
      'Use a formal academic register throughout.',
    ],
    minWords: 130,
    maxWords: 180,
    suggestedStructure: ['Qualified position', 'Concession', 'Principal argument', 'Conclusion'],
  },
  {
    id: 'writing-advanced-expository',
    difficulty: 'advanced',
    category: 'expository',
    title: 'How misinformation spreads',
    prompt:
      'Explain the mechanisms by which inaccurate information spreads through online networks faster than corrections do.',
    instructions: [
      'Explain at least three distinct mechanisms.',
      'Maintain an objective, explanatory tone.',
      'Use precise terminology and define it where necessary.',
      'Avoid recommending solutions; this task asks only for explanation.',
    ],
    minWords: 130,
    maxWords: 180,
    suggestedStructure: ['Overview', 'Mechanism 1', 'Mechanism 2', 'Mechanism 3', 'Synthesis'],
  },
  {
    id: 'writing-advanced-descriptive',
    difficulty: 'advanced',
    category: 'descriptive',
    title: 'A landscape changed by time',
    prompt:
      'Describe a place you have known over many years and the way it has changed. Convey both the physical change and its emotional weight.',
    instructions: [
      'Contrast past and present states of the place.',
      'Use figurative language sparingly and precisely.',
      'Control tense shifts carefully.',
      'Let the emotional meaning emerge from detail rather than being stated.',
    ],
    minWords: 130,
    maxWords: 180,
    suggestedStructure: ['The place now', 'The place before', 'The point of change', 'What remains'],
  },
]

export function getWritingPrompt(id: string): WritingPrompt {
  return WRITING_PROMPTS.find((prompt) => prompt.id === id) ?? WRITING_PROMPTS[0]
}

export function writingPromptsForDifficulty(difficulty: Difficulty): WritingPrompt[] {
  const matches = WRITING_PROMPTS.filter((prompt) => prompt.difficulty === difficulty)
  return matches.length > 0 ? matches : WRITING_PROMPTS
}

/** Rotates through the categories so repeat attempts do not always show the same task. */
export function pickWritingPrompt(difficulty: Difficulty, attemptIndex: number): WritingPrompt {
  const pool = writingPromptsForDifficulty(difficulty)
  return pool[attemptIndex % pool.length]
}
