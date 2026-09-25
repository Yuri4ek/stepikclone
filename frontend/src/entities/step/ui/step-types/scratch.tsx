import { Field, Icon, Input, Markdown } from '@/shared/ui'
import { scratchProjectId, str, submitConfig, validateAnswerKey, type SubmitConfig } from '../../lib/content'
import { BLOCKS_HINT, CriteriaField, DefaultReviewView, ManualSubmitForm, MarkdownField, SubmitConfigField } from '../common'
import { AnswerForm, AnswerKeyFields } from './answer'
import type { EditorProps, StepTypeDef } from '../../model/types'

export function ScratchEmbed({ url, title }: { url: string; title: string }) {
  const id = scratchProjectId(url)
  if (!id) return null
  return (
    <div className="overflow-hidden rounded-card border border-brand-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-line px-5 py-3 text-sm">
        <span className="font-semibold">{title}</span>
        <a href={`https://scratch.mit.edu/projects/${id}/editor`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 font-semibold text-brand-blue hover:underline">
          Открыть в редакторе Scratch
          <Icon name="external" size={16} />
        </a>
      </div>
      <div className="aspect-[485/402] max-h-[480px] w-full">
        <iframe src={`https://scratch.mit.edu/projects/${id}/embed`} title={title} className="size-full" allowFullScreen />
      </div>
    </div>
  )
}

function ProjectUrlField({ content, onChange }: EditorProps) {
  return (
    <Field label="Проект-пример в Scratch (необязательно)" hint="Ссылка вида https://scratch.mit.edu/projects/123456 — встроится в шаг">
      <Input value={str(content, 'project_url')} onChange={(e) => onChange({ ...content, project_url: e.target.value })} placeholder="https://scratch.mit.edu/projects/…" />
    </Field>
  )
}

const SCRATCH_SUBMIT: SubmitConfig = { link: 'required', screenshot: 'off', text: 'optional' }


export const scratchStep: StepTypeDef = {
  id: 'scratch',
  kind: 'task',
  label: 'Scratch: проект по ссылке',
  description: 'Разбор блочной программы; ученик меняет проект и сдаёт ссылку. Проверяет куратор.',
  group: 'Scratch',
  icon: 'blocks',
  check: 'manual',
  defaultMaxScore: 10,
  defaultContent: () => ({ type: 'scratch', markdown: '', project_url: '', criteria: '', submit: SCRATCH_SUBMIT }),
  validate: (c) => (str(c, 'markdown').trim() ? null : 'Опишите задание'),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Задание" rows={12} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} hint={BLOCKS_HINT} />
      <ProjectUrlField content={content} onChange={onChange} />
      <SubmitConfigField content={content} onChange={onChange} defaults={SCRATCH_SUBMIT} linkKind={false} />
      <CriteriaField content={content} onChange={onChange} />
    </div>
  ),

  Player: ({ step, content, busy, canSubmit, submit }) => (
    <div className="space-y-6">
      <Markdown>{str(content, 'markdown')}</Markdown>
      <ScratchEmbed url={str(content, 'project_url')} title="Проект для разбора" />
      <ManualSubmitForm
        stepId={step.id}
        busy={busy}
        canSubmit={canSubmit}
        submit={submit}
        config={submitConfig(content, SCRATCH_SUBMIT)}
        linkKind="scratch"
        textLabel="Объясни, что ты изменил"
        textPlaceholder="Какие блоки поменял и что теперь происходит, когда нажимаешь на флажок"
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


export const scratchAnswerStep: StepTypeDef = {
  id: 'scratch_answer',
  kind: 'quiz',
  label: 'Scratch: разбор с ответом',
  description: 'Ученик разбирает блочную программу и отвечает числом. Результат — сразу.',
  group: 'Scratch',
  icon: 'blocks',
  check: 'auto',
  defaultMaxScore: 5,
  defaultContent: () => ({ type: 'scratch_answer', markdown: '', question: '', correct_answer: '', answer_kind: 'number' }),
  validate: (c) => (!str(c, 'markdown').trim() ? 'Добавьте программу для разбора' : !str(c, 'question').trim() ? 'Введите вопрос' : validateAnswerKey(c)),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Программа и пояснение" rows={10} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} hint={BLOCKS_HINT} />
      <ProjectUrlField content={content} onChange={onChange} />
      <MarkdownField label="Вопрос" rows={2} value={str(content, 'question')} onChange={(question) => onChange({ ...content, question })} />
      <AnswerKeyFields content={content} onChange={onChange} />
    </div>
  ),

  Player: (props) => (
    <AnswerForm {...props}>
      <Markdown>{str(props.content, 'markdown')}</Markdown>
      <ScratchEmbed url={str(props.content, 'project_url')} title="Проект для разбора" />
      <div className="rounded-card border border-brand-blue-200 bg-brand-blue-50 p-5">
        <div className="eyebrow mb-1 text-brand-blue">Вопрос</div>
        <Markdown>{str(props.content, 'question')}</Markdown>
      </div>
    </AnswerForm>
  ),
}
