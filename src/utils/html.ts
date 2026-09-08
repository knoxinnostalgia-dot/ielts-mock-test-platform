const BLOCK_TAGS = /<\/(p|div|li|h[1-6]|blockquote)>/gi
const LINE_BREAKS = /<br\s*\/?>/gi
const TAGS = /<[^>]+>/g

/**
 * Converts editor HTML into plain text with blank lines between blocks so the
 * writing analytics can count paragraphs and sentences reliably.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  if (!/[<>]/.test(html)) return html

  const withBreaks = html
    .replace(/<\/(ul|ol)>/gi, '\n\n')
    .replace(BLOCK_TAGS, '\n\n')
    .replace(LINE_BREAKS, '\n')
    .replace(TAGS, ' ')

  const decoded = withBreaks
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")

  return decoded
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
