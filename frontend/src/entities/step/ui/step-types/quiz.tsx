import { useState } from 'react'
import { cx } from '@/shared/lib'
import { Button, Input, Markdown } from '@/shared/ui'
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
                className="size-4 accent-status-success"
                aria-label="Правильный ответ"
              />
              <span className="w-5 text-sm font-medium text-content-secondary">{o.id}</span>
              <Input value={o.text} onChange={(e) => setOptions(options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder={`Вариант ${i + 1}`} />
              <button type="button" onClick={() => setOptions(options.filter((_, j) => j !== i))} className="px-2 text-content-secondary hover:text-status-error" aria-label="Удалить вариант">
                ✕
              </button>
            </div>
          ))}
        </div>
        <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => setOptions([...options, { id: nextId(), text: '' }])}>
          + Вариант
        </Button>
      </div>
      <MarkdownField label="Пояснение после ответа (необязательно)" rows={3} value={str(content, 'explanation')} onChange={(explanation) => onChange({ ...content, explanation })} />
    </div>
  )
}

export const quizStep: StepTypeDef = {
  id: 'quiz',
  kind: 'quiz',
  label: 'Контрольный вопрос',
  description: 'Вопрос с вариантами ответа. Проверяется автоматически, результат — сразу.',
  icon: '❓',
  color: '#0EA5E9',
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
                'flex cursor-pointer items-center gap-3 rounded-2xl px-5 py-4 transition-all',
                selected === o.id ? 'bg-brand/12 text-brand-deep ring-2 ring-brand/40' : 'bg-brand/[0.05] hover:bg-brand/[0.09]',
              )}
            >
              <input type="radio" name="option" value={o.id} checked={selected === o.id} onChange={() => setSelected(o.id)} className="size-4 accent-brand" />
              <span>{o.text}</span>
            </label>
          ))}
        </fieldset>
        {passed && str(content, 'explanation') && (
          <div className="rounded-3xl bg-emerald-500/10 p-5">
            <Markdown className="prose-sm">{str(content, 'explanation')}</Markdown>
          </div>
        )}
        <Button type="submit" loading={busy} disabled={!canSubmit || !selected}>
          {passed ? 'Ответить ещё раз' : 'Проверить'}
        </Button>
      </form>
    )
  },
}
