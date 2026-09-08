/** Deterministic text statistics powering the writing analytics. */

export interface TextStats {
  wordCount: number
  characterCount: number
  sentenceCount: number
  paragraphCount: number
  uniqueWords: number
  uniqueWordRatio: number
  averageSentenceLength: number
  /** Population standard deviation of sentence lengths (words). */
  sentenceLengthVariety: number
  longSentences: number
  shortSentences: number
  connectiveCount: number
  academicWordCount: number
  readingTimeSeconds: number
}

const CONNECTIVES = [
  'however',
  'therefore',
  'moreover',
  'furthermore',
  'nevertheless',
  'consequently',
  'although',
  'whereas',
  'despite',
  'in addition',
  'for instance',
  'for example',
  'on the other hand',
  'as a result',
  'in contrast',
  'firstly',
  'secondly',
  'finally',
  'in conclusion',
  'overall',
]

const ACADEMIC_WORDS = [
  'significant',
  'analysis',
  'evidence',
  'factor',
  'impact',
  'benefit',
  'consequence',
  'policy',
  'research',
  'sustainable',
  'infrastructure',
  'perspective',
  'contribute',
  'demonstrate',
  'implement',
  'substantial',
  'crucial',
  'approach',
  'resource',
  'community',
  'economic',
  'environment',
  'technology',
  'individual',
  'society',
]

export function splitWords(text: string): string[] {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .split(/[^A-Za-z0-9'\u00C0-\u024F-]+/)
    .map((word) => word.replace(/^['-]+|['-]+$/g, ''))
    .filter((word) => word.length > 0)
}

export function countWords(text: string): number {
  return splitWords(text).length
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])[\s\n]+|\n{2,}/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => splitWords(sentence).length > 0)
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\r\n\r\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
}

export function analyzeText(text: string): TextStats {
  const trimmed = text.trim()
  const words = splitWords(trimmed)
  const sentences = splitSentences(trimmed)
  const paragraphs = splitParagraphs(trimmed)
  const lower = trimmed.toLowerCase()

  const sentenceLengths = sentences.map((sentence) => splitWords(sentence).length)
  const averageSentenceLength = sentenceLengths.length
    ? sentenceLengths.reduce((sum, value) => sum + value, 0) / sentenceLengths.length
    : 0
  const variance = sentenceLengths.length
    ? sentenceLengths.reduce((sum, value) => sum + (value - averageSentenceLength) ** 2, 0) /
      sentenceLengths.length
    : 0

  const uniqueWords = new Set(words.map((word) => word.toLowerCase())).size

  return {
    wordCount: words.length,
    characterCount: trimmed.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    uniqueWords,
    uniqueWordRatio: words.length ? uniqueWords / words.length : 0,
    averageSentenceLength,
    sentenceLengthVariety: Math.sqrt(variance),
    longSentences: sentenceLengths.filter((length) => length > 28).length,
    shortSentences: sentenceLengths.filter((length) => length < 7).length,
    connectiveCount: CONNECTIVES.filter((connective) => lower.includes(connective)).length,
    academicWordCount: ACADEMIC_WORDS.filter((word) => lower.includes(word)).length,
    readingTimeSeconds: Math.round((words.length / 200) * 60),
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function percent(value: number, total: number): number {
  if (total <= 0) return 0
  return clamp(Math.round((value / total) * 100), 0, 100)
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
