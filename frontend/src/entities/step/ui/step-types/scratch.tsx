import { Field, Input, Markdown } from '@/shared/ui'
import { str } from '../../lib/content'
import { Criteria, CriteriaField, DefaultReviewView, ManualSubmitForm, MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

export function scratchProjectId(url: string): string | null {
  return url.match(/scratch\.mit\.edu\/projects\/(\d+)/)?.[1] ?? null
}

function ScratchEmbed({ url, title }: { url: string; title: string }) {
  const id = scratchProjectId(url)
  if (!id) return null
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-orange-500/10">
      <div className="flex items-center justify-between bg-gradient-to-r from-orange-400/20 to-amber-300/10 px-5 py-3 text-sm">
        <span className="font-medium text-orange-700">{title}</span>
        <a href={`https://scratch.mit.edu/projects/${id}/editor`} target="_blank" rel="noreferrer noopener" className="rounded-full bg-white/70 px-3 py-1 font-medium text-orange-700">
          Открыть в редакторе Scratch ↗
        </a>
      </div>
      <div className="aspect-[485/402] max-h-[480px] w-full">
        <iframe src={`https://scratch.mit.edu/projects/${id}/embed`} title={title} className="size-full" allowFullScreen />
      </div>
    </div>
  )
}

export const scratchStep: StepTypeDef = {
  id: 'scratch',
  kind: 'task',
  label: 'Scratch',
  description: 'Ученик разбирает блочную программу и показывает свой результат ссылкой на проект Scratch. Проверяет куратор.',
  icon: '🐱',
  color: '#F97316',
  check: 'manual',
  defaultMaxScore: 20,
  defaultContent: () => ({ type: 'scratch', markdown: '', project_url: '', criteria: '' }),
  validate: (c) => (str(c, 'markdown').trim() ? null : 'Опишите задание'),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Задание" rows={8} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} hint="Что нужно разобрать в блочной программе и что показать" />
      <Field label="Проект-пример для разбора" hint="Ссылка вида https://scratch.mit.edu/projects/123456 — встроится в шаг">
        <Input value={str(content, 'project_url')} onChange={(e) => onChange({ ...content, project_url: e.target.value })} placeholder="https://scratch.mit.edu/projects/…" />
      </Field>
      <CriteriaField content={content} onChange={onChange} />
    </div>
  ),

  Player: ({ step, content, busy, canSubmit, submit }) => (
    <div className="space-y-5">
      <Markdown>{str(content, 'markdown')}</Markdown>
      <ScratchEmbed url={str(content, 'project_url')} title="Проект для разбора" />
      <Criteria content={content} />
      <ManualSubmitForm
        stepId={step.id}
        busy={busy}
        canSubmit={canSubmit}
        submit={submit}
        linkLabel="Ссылка на ваш проект в Scratch"
        linkPlaceholder="https://scratch.mit.edu/projects/…"
        linkRequired
        textLabel="Объясните, как работает ваша программа"
        textPlaceholder="Какие блоки использовали и что происходит, когда нажимаешь на флажок"
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
