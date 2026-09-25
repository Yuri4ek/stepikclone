import { Field, Markdown, Select } from '@/shared/ui'
import { str } from '../../lib/content'
import { Criteria, CriteriaField, ManualSubmitForm, MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

/** Любая работа, которую нельзя проверить машиной: проект, файл, ссылка на результат */
export const projectStep: StepTypeDef = {
  id: 'project',
  kind: 'task',
  label: 'Проект',
  description: 'Файл или ссылка на результат, уходит куратору в очередь.',
  icon: 'upload',
  check: 'manual',
  defaultMaxScore: 20,
  defaultContent: () => ({ type: 'project', markdown: '', answer_format: 'text', criteria: '' }),
  validate: (c) => (str(c, 'markdown').trim() ? null : 'Опишите задание'),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Задание" rows={8} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} />
      <Field label="Формат сдачи">
        <Select value={str(content, 'answer_format') || 'text'} onChange={(e) => onChange({ ...content, answer_format: e.target.value })} className="max-w-xs">
          <option value="text">Текстовый ответ</option>
          <option value="link">Ссылка на результат (файл, диск, репозиторий)</option>
          <option value="both">Текст и ссылка</option>
        </Select>
      </Field>
      <CriteriaField content={content} onChange={onChange} />
    </div>
  ),

  Player: ({ step, content, busy, canSubmit, submit }) => {
    const format = str(content, 'answer_format') || 'text'
    return (
      <div className="space-y-5">
        <Markdown>{str(content, 'markdown')}</Markdown>
        <Criteria content={content} />
        <ManualSubmitForm
          stepId={step.id}
          busy={busy}
          canSubmit={canSubmit}
          submit={submit}
          linkLabel={format === 'text' ? undefined : 'Ссылка на файл или результат'}
          linkPlaceholder="https://disk.yandex.ru/…"
          linkRequired={format === 'link'}
          textLabel={format === 'link' ? 'Комментарий (можно не заполнять)' : 'Ответ'}
        />
      </div>
    )
  },
}
