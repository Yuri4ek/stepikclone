import { Button, Field, Input, Markdown } from '@/shared/ui'
import { str } from '../../lib/content'
import { useDraft } from '../../model/useDraft'
import { MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

/** Нормализация, чтобы «42», « 42 » и «42,0»→«42.0» сравнивались одинаково */
export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').replace(/(\d),(\d)/g, '$1.$2')
}

/**
 * Задача с ответом. Использует автопроверку quiz на бэкенде: правильный ответ хранится
 * в correct_option_id (бэкенд его ученику не отдаёт), ответ ученика уходит как selected_option_id.
 */
export const answerStep: StepTypeDef = {
  id: 'answer',
  kind: 'quiz',
  label: 'Задача с ответом',
  description: 'Короткий ответ: число или слово. Проверяется автоматически, результат — сразу.',
  icon: 'hash',
  check: 'auto',
  defaultMaxScore: 10,
  defaultContent: () => ({ type: 'answer', question: '', options: [], correct_option_id: '' }),
  validate: (c) => {
    if (!str(c, 'question').trim()) return 'Введите условие'
    if (!str(c, 'correct_option_id').trim()) return 'Укажите правильный ответ'
    return null
  },

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Условие задачи" rows={8} value={str(content, 'question')} onChange={(question) => onChange({ ...content, question })} />
      <Field label="Правильный ответ" hint="Регистр и лишние пробелы не важны; «3,5» и «3.5» считаются одинаковыми">
        <Input value={str(content, 'correct_option_id')} onChange={(e) => onChange({ ...content, options: [], correct_option_id: normalizeAnswer(e.target.value) })} placeholder="42" />
      </Field>
    </div>
  ),

  Player: ({ step, content, busy, canSubmit, submit }) => {
    const [value, setValue] = useDraft(step.id, '')
    return (
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) submit({ selected_option_id: normalizeAnswer(value) })
        }}
      >
        <Markdown>{str(content, 'question')}</Markdown>
        <Field label="Твой ответ">
          <Input value={value} onChange={(e) => setValue(e.target.value)} disabled={!canSubmit} className="max-w-xs" autoComplete="off" />
        </Field>
        <Button type="submit" loading={busy} disabled={!canSubmit || !value.trim()}>
          {step.progress.status === 'failed' ? 'Отправить снова' : 'Проверить'}
        </Button>
      </form>
    )
  },
}
