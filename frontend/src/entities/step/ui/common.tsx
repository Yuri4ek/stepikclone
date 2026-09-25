import type { ReactNode } from 'react'
import type { Answers, StepContent } from '@/shared/api'
import { Button, Field, Input, Markdown, Segmented, Textarea } from '@/shared/ui'
import { useState } from 'react'
import { isUrl, str } from '../lib/content'
import { useDraft } from '../model/useDraft'

// ---------- Редактор ----------

export function MarkdownField({ label, value, onChange, rows = 8, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: ReactNode }) {
  const [preview, setPreview] = useState<'text' | 'preview'>('text')
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <Segmented
          value={preview}
          onChange={setPreview}
          className="text-xs"
          options={[
            { value: 'text', label: 'Текст' },
            { value: 'preview', label: 'Просмотр' },
          ]}
        />
      </div>
      {preview === 'preview' ? (
        <div className="min-h-24 rounded-field border border-brand-line bg-white p-4">{value.trim() ? <Markdown>{value}</Markdown> : <span className="text-sm text-brand-ink-3">Пусто</span>}</div>
      ) : (
        <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" placeholder="Поддерживается Markdown: **жирный**, списки, `код`, таблицы" />
      )}
      {hint && <span className="mt-1.5 block text-xs text-brand-ink-2">{hint}</span>}
    </div>
  )
}

export function CriteriaField({ content, onChange }: { content: StepContent; onChange: (c: StepContent) => void }) {
  return (
    <Field label="Критерии проверки для куратора" hint="Ученик их тоже видит — так оценка становится понятной">
      <Textarea rows={3} value={str(content, 'criteria')} onChange={(e) => onChange({ ...content, criteria: e.target.value })} placeholder="Например: программа работает; есть объяснение; аккуратное оформление" />
    </Field>
  )
}

// ---------- Плеер ----------

export function Criteria({ content }: { content: StepContent }) {
  const c = str(content, 'criteria')
  if (!c.trim()) return null
  return (
    <div className="rounded-card border border-brand-blue-200 bg-brand-blue-50 p-5">
      <div className="eyebrow mb-1 text-brand-blue">Как будут оценивать</div>
      <Markdown className="prose-sm">{c}</Markdown>
    </div>
  )
}

interface ManualFormProps {
  stepId: string
  busy: boolean
  canSubmit: boolean
  submit: (a: Answers) => void
  linkLabel?: string
  linkPlaceholder?: string
  linkRequired?: boolean
  textLabel?: string
  textPlaceholder?: string
  extra?: Answers
  extraValid?: boolean
  children?: ReactNode
}

/** Форма сдачи работы на ручную проверку: текст + ссылка на результат */
export function ManualSubmitForm({
  stepId,
  busy,
  canSubmit,
  submit,
  linkLabel,
  linkPlaceholder,
  linkRequired,
  textLabel = 'Ответ',
  textPlaceholder = 'Расскажи, что сделал и почему',
  extra,
  extraValid = true,
  children,
}: ManualFormProps) {
  // Черновик не очищаем после отправки: если куратор вернёт работу, ученик дорабатывает её, а не пишет заново
  const [draft, setDraft] = useDraft(stepId, { text: '', link: '' })
  const linkOk = !draft.link || isUrl(draft.link)
  const valid = extraValid && linkOk && (linkRequired ? isUrl(draft.link) : true) && (draft.text.trim() || draft.link.trim())

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        const answers: Answers = { text: draft.text.trim(), ...extra }
        if (draft.link) answers.link = draft.link.trim()
        if (!answers.text && draft.link) answers.text = draft.link.trim()
        submit(answers)
      }}
    >
      {children}
      {linkLabel && (
        <Field label={linkLabel + (linkRequired ? ' *' : '')} hint={!linkOk ? <span className="text-brand-amber-text">Ссылка должна начинаться с http:// или https://</span> : undefined}>
          <Input type="url" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder={linkPlaceholder} disabled={!canSubmit} />
        </Field>
      )}
      <Field label={textLabel}>
        <Textarea rows={5} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder={textPlaceholder} disabled={!canSubmit} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={busy} disabled={!canSubmit || !valid}>
          Отправить на проверку
        </Button>
        <span className="text-sm text-brand-ink-2">Работу посмотрит куратор, результат появится здесь</span>
      </div>
    </form>
  )
}

export function DefaultReviewView({ payload }: { payload: Answers }) {
  const text = str(payload, 'text')
  const link = str(payload, 'link')
  return (
    <div className="space-y-3">
      {link && (
        <div>
          <div className="eyebrow text-brand-ink-3">Ссылка на результат</div>
          <a href={link} target="_blank" rel="noreferrer noopener" className="break-all text-brand-blue underline">
            {link}
          </a>
        </div>
      )}
      {text && text !== link && (
        <div>
          <div className="eyebrow text-brand-ink-3">Ответ</div>
          <div className="mt-1 rounded-field bg-brand-mist p-4 text-sm whitespace-pre-wrap">{text}</div>
        </div>
      )}
      {!text && !link && <div className="text-sm text-brand-ink-2">Пустой ответ</div>}
    </div>
  )
}
