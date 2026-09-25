import { Markdown } from '@/shared/ui'
import { str, submitConfig, type SubmitConfig } from '../../lib/content'
import { BLOCKS_HINT, CriteriaField, DefaultReviewView, ManualSubmitForm, MarkdownField, SubmitConfigField } from '../common'
import { ScratchEmbed } from './scratch'
import type { StepTypeDef } from '../../model/types'


function legacyDefaults(format: string): SubmitConfig {
  if (format === 'link') return { link: 'required', screenshot: 'off', text: 'optional' }
  if (format === 'both') return { link: 'required', screenshot: 'off', text: 'required' }
  return { link: 'optional', screenshot: 'optional', text: 'required' }
}


export const projectStep: StepTypeDef = {
  id: 'project',
  kind: 'task',
  label: 'Проект',
  description: 'Самостоятельная работа по критериям. Ученик сдаёт ссылку, скриншот или текст — проверяет куратор.',
  group: 'Любой курс',
  icon: 'upload',
  check: 'manual',
  defaultMaxScore: 25,
  defaultContent: () => ({ type: 'project', markdown: '', criteria: '', submit: { link: 'required', screenshot: 'optional', text: 'optional' }, link_kind: 'any' }),
  validate: (c) => (str(c, 'markdown').trim() ? null : 'Опишите задание'),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Задание" rows={12} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} hint={BLOCKS_HINT} />
      <SubmitConfigField content={content} onChange={onChange} defaults={legacyDefaults(str(content, 'answer_format'))} />
      <CriteriaField content={content} onChange={onChange} />
    </div>
  ),

  Player: ({ step, content, busy, canSubmit, submit }) => (
    <div className="space-y-6">
      <Markdown>{str(content, 'markdown')}</Markdown>
      <ManualSubmitForm
        stepId={step.id}
        busy={busy}
        canSubmit={canSubmit}
        submit={submit}
        config={submitConfig(content, legacyDefaults(str(content, 'answer_format')))}
        linkKind={str(content, 'link_kind') || 'any'}
        textLabel="Объясни решение"
        textPlaceholder="Какие блоки и циклы использовал и зачем"
      />
    </div>
  ),

  ReviewView: ({ payload }) => (
    <div className="space-y-4">
      <ScratchEmbed url={str(payload, 'link')} title="Проект ученика" />
      <DefaultReviewView payload={payload} />
    </div>
  ),
}
