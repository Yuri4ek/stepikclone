import { useEffect, useState, type ReactNode } from 'react'
import type { Answers, StepContent } from '../api'
import { Markdown } from '../components/Markdown'
import { Button, Field, Input, Textarea, cx } from '../components/ui'

// ---------- Доступ к полям content ----------

export function str(c: StepContent | Answers, key: string): string {
  const v = c[key]
  return typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v)
}

export function list<T>(c: StepContent | Answers, key: string): T[] {
  const v = c[key]
  return Array.isArray(v) ? (v as T[]) : []
}

// ---------- Редактор ----------

export function MarkdownField({ label, value, onChange, rows = 8, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: ReactNode }) {
  const [preview, setPreview] = useState(false)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex rounded-full bg-brand/8 p-0.5 text-xs">
          {(['Текст', 'Просмотр'] as const).map((t, i) => (
            <button
              key={t}
              type="button"
              onClick={() => setPreview(i === 1)}
              className={cx('rounded-full px-2.5 py-1 font-medium', preview === (i === 1) ? 'bg-white text-brand shadow-sm' : 'text-content-secondary')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {preview ? (
        <div className="min-h-24 rounded-2xl bg-white/80 p-4">
          {value.trim() ? <Markdown>{value}</Markdown> : <span className="text-sm text-slate-400">Пусто</span>}
        </div>
      ) : (
        <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" placeholder="Поддерживается Markdown: **жирный**, списки, `код`, таблицы" />
      )}
      {hint && <span className="mt-1 block text-xs text-content-secondary">{hint}</span>}
    </div>
  )
}

export function CriteriaField({ content, onChange }: { content: StepContent; onChange: (c: StepContent) => void }) {
  return (
    <Field label="Критерии проверки для куратора" hint="Ученик их тоже видит — так оценка становится понятной">
      <Textarea rows={3} value={str(content, 'criteria')} onChange={(e) => onChange({ ...content, criteria: e.target.value })} placeholder="Например: программа работает; есть обоснование; аккуратное оформление" />
    </Field>
  )
}

// ---------- Плеер ----------

/** Черновик ответа хранится в браузере — не теряется при перезагрузке и после возврата работы */
export function useDraft<T>(stepId: string, initial: T): [T, (v: T) => void] {
  const key = `ks_draft_${stepId}`
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* хранилище недоступно — черновик просто не сохранится */
    }
  }, [key, value])
  return [value, setValue]
}

export function Criteria({ content }: { content: StepContent }) {
  const c = str(content, 'criteria')
  if (!c.trim()) return null
  return (
    <div className="rounded-3xl bg-brand-violet/8 p-5">
      <div className="mb-1 text-sm font-medium text-brand-violet">Как будет оцениваться</div>
      <Markdown className="prose-sm">{c}</Markdown>
    </div>
  )
}

export function isUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
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
  textPlaceholder = 'Опишите, что сделали и почему',
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
        <Field label={linkLabel + (linkRequired ? ' *' : '')} hint={!linkOk ? <span className="text-status-error">Ссылка должна начинаться с http:// или https://</span> : undefined}>
          <Input type="url" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder={linkPlaceholder} disabled={!canSubmit} />
        </Field>
      )}
      <Field label={textLabel}>
        <Textarea rows={5} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder={textPlaceholder} disabled={!canSubmit} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy} disabled={!canSubmit || !valid}>
          Отправить куратору
        </Button>
        <span className="text-xs text-content-secondary">Работу проверит куратор — результат появится здесь</span>
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
          <div className="text-xs font-medium text-content-secondary">Ссылка на результат</div>
          <a href={link} target="_blank" rel="noreferrer noopener" className="break-all text-brand-hover underline">
            {link}
          </a>
        </div>
      )}
      {text && text !== link && (
        <div>
          <div className="text-xs font-medium text-content-secondary">Ответ</div>
          <div className="mt-1 rounded-2xl bg-brand/6 p-4 text-sm whitespace-pre-wrap">{text}</div>
        </div>
      )}
      {!text && !link && <div className="text-sm text-content-secondary">Пустой ответ</div>}
    </div>
  )
}
