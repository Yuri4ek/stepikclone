import { useState } from 'react'
import { cx } from '@/shared/lib'
import { Button, Icon, Input, Markdown } from '@/shared/ui'
import { list, str } from '../../lib/content'
import { BLOCKS_HINT, MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

interface Option {
  id: string
  text: string
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

function isMultiple(c: Record<string, unknown>) {
  return c.mode === 'multiple' || c.multiple === true || Array.isArray(c.correct_option_ids)
}

function QuizEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const options = list<Option>(content, 'options')
  const multiple = isMultiple(content)
  const correct = multiple ? list<string>(content, 'correct_option_ids') : [str(content, 'correct_option_id')]
  const setOptions = (opts: Option[]) => onChange({ ...content, options: opts })
  const toggle = (id: string) => {
    if (!multiple) return onChange({ ...content, correct_option_id: id })
    onChange({ ...content, correct_option_ids: correct.includes(id) ? correct.filter((x) => x !== id) : [...correct, id] })
  }
  const setMultiple = (m: boolean) => {
    const { correct_option_id: _one, correct_option_ids: _many, multiple: _flag, ...rest } = content
    void _one
    void _many
    void _flag
    onChange(m ? { ...rest, multiple: true, correct_option_ids: correct.filter(Boolean).slice(0, 1) } : { ...rest, correct_option_id: correct[0] ?? '' })
  }

  const nextId = () => LETTERS.split('').find((l) => !options.some((o) => o.id === l)) ?? `o${options.length + 1}`

  return (
    <div className="space-y-4">
      <MarkdownField label="Вопрос" rows={5} value={str(content, 'question')} onChange={(question) => onChange({ ...content, question })} hint={BLOCKS_HINT} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} className="size-4 accent-[#3457F0]" />
        Несколько верных вариантов (ученик выбирает все подходящие)
      </label>
      <div>
        <div className="mb-2 text-sm font-medium">Варианты ответа — отметьте {multiple ? 'все верные' : 'верный'}</div>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name="correct"
                checked={correct.includes(o.id)}
                onChange={() => toggle(o.id)}
                className="size-4 accent-[#17915A]"
                aria-label="Верный вариант"
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
      <MarkdownField label="Пояснение после верного ответа (необязательно)" rows={3} value={str(content, 'explanation')} onChange={(explanation) => onChange({ ...content, explanation })} />
      <MarkdownField label="Подсказка после неверного ответа (необязательно)" rows={2} value={str(content, 'hint')} onChange={(hint) => onChange({ ...content, hint })} />
    </div>
  )
}

export const quizStep: StepTypeDef = {
  id: 'quiz',
  kind: 'quiz',
  label: 'Контрольный вопрос',
  description: 'Один или несколько верных вариантов. Проверяется автоматически, результат — сразу.',
  group: 'Основа любого курса',
  icon: 'question',
  check: 'auto',
  defaultMaxScore: 5,
  defaultContent: () => ({
    type: 'quiz',
    question: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
    ],
    correct_option_id: 'a',
  }),
  validate: (c) => {
    const opts = list<Option>(c, 'options')
    if (!str(c, 'question').trim()) return 'Введите вопрос'
    if (opts.length < 2) return 'Нужно минимум 2 варианта'
    if (opts.some((o) => !o.text.trim())) return 'Заполните все варианты'
    if (isMultiple(c)) {
      const ids = list<string>(c, 'correct_option_ids')
      if (!ids.length || ids.some((id) => !opts.some((o) => o.id === id))) return 'Отметьте верные варианты'
    } else if (!opts.some((o) => o.id === str(c, 'correct_option_id'))) return 'Отметьте верный вариант'
    return null
  },
  Editor: QuizEditor,

  Player: function QuizPlayer({ step, content, busy, canSubmit, submit }) {
    const multiple = isMultiple(content)
    const [selected, setSelected] = useState<string[]>([])
    const options = list<Option>(content, 'options')
    const st = step.progress.status
    const pick = (id: string) => setSelected(multiple ? (selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]) : [id])
    return (
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (!selected.length) return
          submit(multiple ? { selected_option_ids: selected } : { selected_option_id: selected[0] })
        }}
      >
        <Markdown>{str(content, 'question')}</Markdown>
        {multiple && <p className="text-sm font-semibold text-brand-ink-2">Выбери все подходящие варианты.</p>}
        <fieldset className="space-y-2" disabled={!canSubmit}>
          <legend className="sr-only">Варианты ответа</legend>
          {options.map((o) => (
            <label
              key={o.id}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-btn border px-5 py-4 transition-colors',
                selected.includes(o.id) ? 'border-brand-blue bg-brand-blue-50' : 'border-brand-line bg-white hover:border-brand-blue-200',
              )}
            >
              <input type={multiple ? 'checkbox' : 'radio'} name="option" value={o.id} checked={selected.includes(o.id)} onChange={() => pick(o.id)} className="size-5 accent-[#3457F0]" />
              <span>{o.text}</span>
            </label>
          ))}
        </fieldset>
        <Button type="submit" loading={busy} disabled={!canSubmit || !selected.length}>
          {st === 'passed' ? 'Ответить ещё раз' : st === 'failed' ? 'Отправить снова' : 'Проверить'}
        </Button>
      </form>
    )
  },
}
