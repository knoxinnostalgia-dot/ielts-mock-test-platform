import { useCallback, useEffect, useRef } from 'react'

import { Icon, type IconName } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'

interface ToolbarAction {
  command: string
  value?: string
  label: string
  icon?: IconName
  text?: string
  shortcut?: string
}

const ACTIONS: ToolbarAction[] = [
  { command: 'bold', label: 'Bold', text: 'B', shortcut: 'Ctrl+B' },
  { command: 'italic', label: 'Italic', text: 'I', shortcut: 'Ctrl+I' },
  { command: 'underline', label: 'Underline', text: 'U', shortcut: 'Ctrl+U' },
  { command: 'insertUnorderedList', label: 'Bulleted list', text: '•' },
  { command: 'insertOrderedList', label: 'Numbered list', text: '1.' },
  { command: 'removeFormat', label: 'Clear formatting', icon: 'close' },
  { command: 'undo', label: 'Undo', icon: 'refresh' },
]

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

/**
 * Compact rich-text editor built on `contentEditable`.
 *
 * The DOM is only rewritten when the incoming value genuinely differs from what
 * is on screen, which keeps the caret stable while the candidate types.
 */
export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Begin writing your response here…',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (editor.innerHTML !== value) editor.innerHTML = value
  }, [value])

  const handleInput = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    onChange(editor.innerHTML)
  }, [onChange])

  const runCommand = useCallback(
    (action: ToolbarAction) => {
      if (disabled) return
      editorRef.current?.focus()
      document.execCommand(action.command, false, action.value)
      handleInput()
    },
    [disabled, handleInput],
  )

  const isEmpty = !value || value === '<br>' || value === '<div><br></div>'

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
        disabled && 'opacity-70',
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800/60"
      >
        {ACTIONS.map((action) => (
          <button
            key={action.command}
            type="button"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(action)}
            title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            aria-label={action.label}
            className={cn(
              'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-bold transition',
              'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
              'disabled:cursor-not-allowed disabled:opacity-40',
              action.command === 'italic' && 'italic',
              action.command === 'underline' && 'underline',
            )}
          >
            {action.icon ? <Icon name={action.icon} size={15} /> : action.text}
          </button>
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        {isEmpty && !disabled && (
          <p className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400 dark:text-slate-500">
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Essay response"
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          spellCheck
          className={cn(
            'h-full min-h-64 overflow-y-auto scrollbar-thin px-4 py-4 text-[15px] leading-7 text-slate-800 outline-none dark:text-slate-100',
            '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1',
            disabled && 'cursor-not-allowed',
          )}
        />
      </div>
    </div>
  )
}
