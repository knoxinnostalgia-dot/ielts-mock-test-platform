import { jsPDF } from 'jspdf'

import type { AnalyticsMetric, SkillId, TestResult } from '@/types'
import { CEFR_BANDS, cefrBand } from './cefr'
import { SKILL_LABELS } from './constants'
import { formatDate, formatDuration } from './time'

const PAGE = { width: 595.28, height: 841.89, margin: 46 }
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2

const COLORS = {
  ink: [15, 23, 42] as const,
  muted: [100, 116, 139] as const,
  line: [226, 232, 240] as const,
  brand: [31, 69, 245] as const,
  good: [16, 185, 129] as const,
  warn: [245, 158, 11] as const,
  bad: [225, 29, 72] as const,
  soft: [241, 245, 249] as const,
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

function toneColor(score: number): readonly [number, number, number] {
  if (score >= 80) return COLORS.good
  if (score >= 55) return COLORS.warn
  return COLORS.bad
}

class ReportBuilder {
  readonly doc: jsPDF
  private y = PAGE.margin

  constructor() {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' })
    this.doc.setFont('helvetica', 'normal')
  }

  get cursor(): number {
    return this.y
  }

  space(amount: number) {
    this.y += amount
  }

  ensure(required: number) {
    if (this.y + required <= PAGE.height - PAGE.margin - 24) return
    this.doc.addPage()
    this.y = PAGE.margin
  }

  sectionTitle(text: string) {
    this.ensure(46)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(13)
    this.doc.setTextColor(...COLORS.ink)
    this.doc.text(text, PAGE.margin, this.y)
    this.y += 8
    this.doc.setDrawColor(...COLORS.brand)
    this.doc.setLineWidth(1.6)
    this.doc.line(PAGE.margin, this.y, PAGE.margin + 34, this.y)
    this.y += 16
  }

  paragraph(text: string, options: { size?: number; muted?: boolean; gap?: number } = {}) {
    const { size = 9.5, muted = true, gap = 10 } = options
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(size)
    const color = muted ? COLORS.muted : COLORS.ink
    this.doc.setTextColor(color[0], color[1], color[2])
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH) as string[]
    this.ensure(lines.length * (size + 3) + gap)
    this.doc.text(lines, PAGE.margin, this.y)
    this.y += lines.length * (size + 3) + gap
  }

  bullet(text: string, color: readonly [number, number, number]) {
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(9.5)
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH - 16) as string[]
    this.ensure(lines.length * 12 + 6)
    this.doc.setFillColor(...color)
    this.doc.circle(PAGE.margin + 3.5, this.y - 3, 2.2, 'F')
    this.doc.setTextColor(...COLORS.ink)
    this.doc.text(lines, PAGE.margin + 14, this.y)
    this.y += lines.length * 12 + 4
  }

  scoreBar(label: string, score: number, detail: string, accent?: string) {
    this.ensure(40)
    const barY = this.y + 6
    const barWidth = CONTENT_WIDTH - 150

    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(9.5)
    this.doc.setTextColor(...COLORS.ink)
    this.doc.text(label, PAGE.margin, this.y + 2)

    this.doc.setFillColor(...COLORS.soft)
    this.doc.roundedRect(PAGE.margin + 96, barY, barWidth, 8, 4, 4, 'F')

    const fill = accent ? hexToRgb(accent) : toneColor(score)
    const width = Math.max(3, (Math.max(0, Math.min(100, score)) / 100) * barWidth)
    this.doc.setFillColor(fill[0], fill[1], fill[2])
    this.doc.roundedRect(PAGE.margin + 96, barY, width, 8, 4, 4, 'F')

    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(10)
    this.doc.setTextColor(...COLORS.ink)
    this.doc.text(`${Math.round(score)}%`, PAGE.width - PAGE.margin, this.y + 2, { align: 'right' })

    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(8)
    this.doc.setTextColor(...COLORS.muted)
    this.doc.text(detail, PAGE.margin, this.y + 15)

    this.y += 30
  }

  metrics(list: AnalyticsMetric[]) {
    list.forEach((item) => this.scoreBar(item.label, item.value, item.detail))
  }

  keyValueGrid(rows: { label: string; value: string }[]) {
    const columns = 3
    const cellWidth = CONTENT_WIDTH / columns
    const rowCount = Math.ceil(rows.length / columns)
    this.ensure(rowCount * 36 + 6)

    rows.forEach((row, index) => {
      const column = index % columns
      const line = Math.floor(index / columns)
      const x = PAGE.margin + column * cellWidth
      const y = this.y + line * 36

      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(7.5)
      this.doc.setTextColor(...COLORS.muted)
      this.doc.text(row.label.toUpperCase(), x, y)

      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(11)
      this.doc.setTextColor(...COLORS.ink)
      this.doc.text(row.value, x, y + 14)
    })

    this.y += rowCount * 36 + 4
  }

  divider() {
    this.ensure(14)
    this.doc.setDrawColor(...COLORS.line)
    this.doc.setLineWidth(0.7)
    this.doc.line(PAGE.margin, this.y, PAGE.width - PAGE.margin, this.y)
    this.y += 14
  }

  finish(candidate: string) {
    const pages = this.doc.getNumberOfPages()
    for (let page = 1; page <= pages; page += 1) {
      this.doc.setPage(page)
      this.doc.setDrawColor(...COLORS.line)
      this.doc.setLineWidth(0.7)
      this.doc.line(
        PAGE.margin,
        PAGE.height - PAGE.margin + 6,
        PAGE.width - PAGE.margin,
        PAGE.height - PAGE.margin + 6,
      )
      this.doc.setFont('helvetica', 'normal')
      this.doc.setFontSize(7.5)
      this.doc.setTextColor(...COLORS.muted)
      this.doc.text(
        `IELTS Mock Test Platform · Candidate report for ${candidate}`,
        PAGE.margin,
        PAGE.height - PAGE.margin + 18,
      )
      this.doc.text(
        `Page ${page} of ${pages}`,
        PAGE.width - PAGE.margin,
        PAGE.height - PAGE.margin + 18,
        { align: 'right' },
      )
    }
  }
}

function coverBlock(builder: ReportBuilder, result: TestResult) {
  const { doc } = builder
  const band = cefrBand(result.cefr)
  const accent = hexToRgb(band.color)

  doc.setFillColor(...COLORS.ink)
  doc.rect(0, 0, PAGE.width, 128, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text('Language Assessment Report', PAGE.margin, 52)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(203, 213, 225)
  doc.text('IELTS Mock Test Platform · Computer-delivered practice assessment', PAGE.margin, 70)

  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.roundedRect(PAGE.width - PAGE.margin - 116, 30, 116, 68, 8, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(255, 255, 255)
  doc.text(result.cefr, PAGE.width - PAGE.margin - 58, 66, { align: 'center' })
  doc.setFontSize(8)
  doc.text(band.label.toUpperCase(), PAGE.width - PAGE.margin - 58, 84, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text(result.candidateName, PAGE.margin, 100)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(148, 163, 184)
  doc.text(
    `Test date: ${formatDate(result.completedAt)}   ·   Mode: ${
      result.mode === 'full' ? 'Full mock test' : 'Individual skill'
    }   ·   Level: ${result.difficulty}`,
    PAGE.margin,
    114,
  )

  builder.space(152 - builder.cursor)
}

export function buildReportDocument(result: TestResult): jsPDF {
  const builder = new ReportBuilder()
  const band = cefrBand(result.cefr)

  coverBlock(builder, result)

  builder.sectionTitle('Overall Performance')
  builder.keyValueGrid([
    { label: 'Overall score', value: `${result.overallScore}%` },
    { label: 'CEFR level', value: `${result.cefr} — ${band.label}` },
    { label: 'Modules attempted', value: String(result.skills.length) },
    {
      label: 'Integrity score',
      value: `${result.proctor.integrityScore}%`,
    },
    { label: 'Focus violations', value: String(result.proctor.focusViolations) },
    {
      label: 'Monitored time',
      value: formatDuration(result.proctor.monitoredSeconds),
    },
  ])
  builder.paragraph(band.description)

  builder.sectionTitle('Section Scores')
  const sections: { skill: SkillId; score: number; detail: string }[] = []
  if (result.listening)
    sections.push({
      skill: 'listening',
      score: result.listening.score,
      detail: `${result.listening.correct}/${result.listening.total} correct · ${result.listening.replaysUsed} replay(s) used`,
    })
  if (result.reading)
    sections.push({
      skill: 'reading',
      score: result.reading.score,
      detail: `${result.reading.correct}/${result.reading.total} correct · ${result.reading.passageTitle}`,
    })
  if (result.writing)
    sections.push({
      skill: 'writing',
      score: result.writing.score,
      detail: `${result.writing.wordCount} words (target ${result.writing.minWords}-${result.writing.maxWords}) · ${result.writing.promptTitle}`,
    })
  if (result.speaking)
    sections.push({
      skill: 'speaking',
      score: result.speaking.score,
      detail: `${result.speaking.repeatCompleted}/${result.speaking.repeatTotal} repeat tasks · cue card ${result.speaking.cueCardDuration.toFixed(0)}s`,
    })

  sections.forEach((section) =>
    builder.scoreBar(SKILL_LABELS[section.skill], section.score, section.detail),
  )

  builder.divider()
  builder.sectionTitle('Detailed Analytics')

  const analyticsBlocks: { title: string; metrics: AnalyticsMetric[] }[] = []
  if (result.listening) analyticsBlocks.push({ title: 'Listening', metrics: result.listening.metrics })
  if (result.reading) analyticsBlocks.push({ title: 'Reading', metrics: result.reading.metrics })
  if (result.writing) analyticsBlocks.push({ title: 'Writing', metrics: result.writing.metrics })
  if (result.speaking) analyticsBlocks.push({ title: 'Speaking', metrics: result.speaking.metrics })

  analyticsBlocks.forEach((block) => {
    builder.ensure(60)
    builder.doc.setFont('helvetica', 'bold')
    builder.doc.setFontSize(10)
    builder.doc.setTextColor(...COLORS.ink)
    builder.doc.text(block.title, PAGE.margin, builder.cursor)
    builder.space(14)
    builder.metrics(block.metrics)
    builder.space(4)
  })

  builder.sectionTitle('Strengths')
  if (result.strengths.length === 0) builder.paragraph('No specific strengths were identified.')
  result.strengths.forEach((item) => builder.bullet(item, COLORS.good))
  builder.space(6)

  builder.sectionTitle('Areas for Improvement')
  if (result.weaknesses.length === 0) builder.paragraph('No specific weaknesses were identified.')
  result.weaknesses.forEach((item) => builder.bullet(item, COLORS.warn))
  builder.space(6)

  builder.sectionTitle('Recommended Learning Path')
  if (result.recommendations.length === 0) {
    builder.paragraph('Continue with mixed practice at your current level.')
  }
  result.recommendations.forEach((recommendation, index) => {
    builder.ensure(44)
    builder.doc.setFont('helvetica', 'bold')
    builder.doc.setFontSize(9.5)
    builder.doc.setTextColor(...COLORS.ink)
    builder.doc.text(`${index + 1}. ${recommendation.title}`, PAGE.margin, builder.cursor)
    builder.space(12)
    builder.paragraph(
      `${recommendation.description} (Focus: ${recommendation.focus} · ${recommendation.estimatedMinutes} minutes · ${recommendation.difficulty})`,
      { gap: 8 },
    )
  })

  builder.divider()
  builder.sectionTitle('Examination Integrity Report')
  builder.keyValueGrid([
    { label: 'Integrity score', value: `${result.proctor.integrityScore}%` },
    { label: 'Tab switches', value: String(result.proctor.tabSwitches) },
    { label: 'Fullscreen exits', value: String(result.proctor.fullscreenExits) },
    { label: 'Face lost events', value: String(result.proctor.faceLostCount) },
    { label: 'Multiple faces', value: String(result.proctor.multipleFaceCount) },
    { label: 'Long absences', value: String(result.proctor.longAbsenceCount) },
  ])
  builder.paragraph(
    'The integrity score is advisory. It is derived from browser focus events and on-device camera analysis, and never affects the language scores above. No video or audio was transmitted or stored outside this device.',
  )

  if (result.writing) {
    builder.ensure(90)
    builder.sectionTitle('Writing Submission')
    builder.paragraph(
      `Task: ${result.writing.promptTitle} (${result.writing.category})`,
      { muted: false, gap: 6 },
    )
    builder.paragraph(result.writing.text || 'No response was submitted.', { size: 9, gap: 8 })
  }

  builder.ensure(60)
  builder.sectionTitle('CEFR Reference Scale')
  CEFR_BANDS.forEach((entry) => {
    builder.bullet(
      `${entry.level} (${entry.min}+): ${entry.label} — ${entry.description}`,
      hexToRgb(entry.color),
    )
  })

  builder.finish(result.candidateName)
  return builder.doc
}

export function downloadReport(result: TestResult): void {
  const doc = buildReportDocument(result)
  const safeName = result.candidateName.replace(/[^\w-]+/g, '_') || 'candidate'
  doc.save(`IELTS_Report_${safeName}_${formatDate(result.completedAt).replace(/\s+/g, '-')}.pdf`)
}
