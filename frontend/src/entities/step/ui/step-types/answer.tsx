import type { ReactNode } from 'react'
import { Button, Field, Input, Markdown, Select, Textarea } from '@/shared/ui'
import { list, str, validateAnswerKey } from '../../lib/content'
import { useDraft } from '../../model/useDraft'
import { BLOCKS_HINT, MarkdownField } from '../common'
import type { EditorProps, PlayerProps, StepTypeDef } from '../../model/types'


export function AnswerKeyFields({ content, onChange }: EditorProps) {
  const accepted = list<string>(content, 'accepted_answers')
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field label="Правильный ответ" hint="Регистр, лишние пробелы и «3,5» / «3.5» не важны; «45» и «45.0» считаются одинаковыми">
          <Input value={str(content, 'correct_answer') || str(content, 'correct_option_id')} onChange={(e) => onChange({ ...content, correct_answer: e.target.value, correct_option_id: undefined })} placeholder="45" />
        </Field>
        <Field label="Ответ — это">
          <Select value={str(content, 'answer_kind') || 'number'} onChange={(e) => onChange({ ...content, answer_kind: e.target.value })}>
            <option value="number">число</option>
            <option value="text">слово или фраза</option>
          </Select>
        </Field>
      </div>
      <Field label="Тоже засчитывать (необязательно)" hint="Другие верные записи ответа, по одной в строке">
        <Textarea rows={2} value={accepted.join('\n')} onChange={(e) => onChange({ ...content, accepted_answers: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
      </Field>
      <MarkdownField label="Подсказка после неверного ответа (необязательно)" rows={2} value={str(content, 'hint')} onChange={(hint) => onChange({ ...content, hint })} />
    </div>
  )
}


export function AnswerForm({ step, content, busy, canSubmit, submit, children }: PlayerProps & { children?: ReactNode }) {
  const [value, setValue] = useDraft(step.id, '')
  const numeric = (str(content, 'answer_kind') || 'number') === 'number'
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) submit({ answer: value.trim() })
      }}
    >
      {children}
      <Field label="Твой ответ">
        <Input value={value} onChange={(e) => setValue(e.target.value)} disabled={!canSubmit} className="max-w-xs text-lg" autoComplete="off" inputMode={numeric ? 'decimal' : 'text'} placeholder={numeric ? 'Число' : ''} />
      </Field>
      <Button type="submit" loading={busy} disabled={!canSubmit || !value.trim()}>
        {step.progress.status === 'failed' ? 'Отправить снова' : step.progress.status === 'passed' ? 'Ответить ещё раз' : 'Проверить'}
      </Button>
    </form>
  )
}


export const answerStep: StepTypeDef = {
  id: 'answer',
  kind: 'quiz',
  label: 'Вопрос с ответом числом',
  description: 'Короткий ответ: число или слово. Проверяется автоматически, результат — сразу.',
  group: 'Основа любого курса',
  icon: 'hash',
  check: 'auto',
  defaultMaxScore: 5,
  defaultContent: () => ({ type: 'answer', question: '', correct_answer: '', answer_kind: 'number' }),
  validate: (c) => (str(c, 'question').trim() ? validateAnswerKey(c) : 'Введите вопрос'),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Вопрос" rows={6} value={str(content, 'question')} onChange={(question) => onChange({ ...content, question })} hint={BLOCKS_HINT} />
      <AnswerKeyFields content={content} onChange={onChange} />
    </div>
  ),

  Player: (props) => (
    <AnswerForm {...props}>
      <Markdown>{str(props.content, 'question')}</Markdown>
    </AnswerForm>
  ),
}
