import { useState } from 'react'
import { cx } from '@/shared/lib'
import { Button, Icon, Input, Markdown } from '@/shared/ui'
import { list, str } from '../../lib/content'
import { MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

interface Option {
  id: string
  text: string
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

function QuizEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const options = list<Option>(content, 'options')
  const correct = str(content, 'correct_option_id')
  const setOptions = (opts: Option[]) => onChange({ ...content, options: opts })

  const nextId = () => LETTERS.split('').find((l) => !options.some((o) => o.id === l)) ?? `o${options.length + 1}`

  return (
    <div className="space-y-4">
      <MarkdownField label="Вопрос" rows={4} value={str(content, 'question')} onChange={(question) => onChange({ ...content, question })} />
      <div>
        <div className="mb-2 text-sm font-medium">Варианты ответа — отметьте правильный</div>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={correct === o.id}
                onChange={() => onChange({ ...content, correct_option_id: o.id })}
                className="size-4 accent-[#17915A]"
                aria-label="Правильный ответ"
              />
              <span className="w-5 font-mono text-sm text-brand-ink-3">{o.id}</span>
              <Input value={o.text} onChange={(e) => setOptions(options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder={`Вариант ${i + 1}`} />
              <button type="button" onClick={() => setOptions(options.filter((_, j) => j !== i))} className="p-2 text-brand-ink-3 hover:text-brand-ink" aria-label="Удалить вариант">
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => setOptions([...options, { id: nextId(), text: '' }])}>
          <Icon name="plus" size={16} />
          Вариант
        </Button>
      </div>
      <MarkdownField label="Пояснение после ответа (необязательно)" rows={3} value={str(content, 'explanation')} onChange={(explanation) => onChange({ ...content, explanation })} />
    </div>
  )
}

export const quizStep: StepTypeDef = {
  id: 'quiz',
  kind: 'quiz',
  label: 'Вопрос',
  description: 'Контрольный вопрос с вариантами ответа. Проверяется автоматически, результат — сразу.',
  icon: 'question',
  check: 'auto',
  defaultMaxScore: 10,
  defaultContent: () => ({
    type: 'quiz',
    question: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
    ],
    correct_option_id: 'a',
    explanation: '',
  }),
  validate: (c) => {
    const opts = list<Option>(c, 'options')
    if (!str(c, 'question').trim()) return 'Введите вопрос'
    if (opts.length < 2) return 'Нужно минимум 2 варианта'
    if (opts.some((o) => !o.text.trim())) return 'Заполните все варианты'
    if (!opts.some((o) => o.id === str(c, 'correct_option_id'))) return 'Отметьте правильный вариант'
    return null
  },
  Editor: QuizEditor,

  Player: ({ step, content, busy, canSubmit, submit }) => {
    const [selected, setSelected] = useState<string>('')
    const options = list<Option>(content, 'options')
    const passed = step.progress.status === 'passed'
    return (
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (selected) submit({ selected_option_id: selected })
        }}
      >
        <Markdown>{str(content, 'question')}</Markdown>
        <fieldset className="space-y-2" disabled={!canSubmit}>
          <legend className="sr-only">Варианты ответа</legend>
          {options.map((o) => (
            <label
              key={o.id}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-btn border px-5 py-4 transition-colors',
                selected === o.id ? 'border-brand-blue bg-brand-blue-50' : 'border-brand-line bg-white hover:border-brand-blue-200',
              )}
            >
              <input type="radio" name="option" value={o.id} checked={selected === o.id} onChange={() => setSelected(o.id)} className="size-5 accent-[#3457F0]" />
              <span>{o.text}</span>
            </label>
          ))}
        </fieldset>
        {passed && str(content, 'explanation') && (
          <div className="rounded-card border border-st-done/20 bg-st-done-bg p-5">
            <Markdown className="prose-sm">{str(content, 'explanation')}</Markdown>
          </div>
        )}
        <Button type="submit" loading={busy} disabled={!canSubmit || !selected}>
          {passed ? 'Ответить ещё раз' : step.progress.status === 'failed' ? 'Отправить снова' : 'Проверить'}
        </Button>
      </form>
    )
  },
}
