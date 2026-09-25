import { useRef, useState, type ReactNode } from 'react'
import { mediaUrl, upload, type Answers, type StepContent } from '@/shared/api'
import { Button, ErrorBox, Field, Icon, Input, Markdown, Segmented, Select, Textarea } from '@/shared/ui'
import { isUrl, linkKinds, str, type FieldMode, type SubmitConfig } from '../lib/content'
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

export const BLOCKS_HINT = (
  <>
    Блочную программу вставляйте так: <code className="font-mono">```blocks</code>, дальше одна строка — один блок, отступ 4 пробела — вложенность, «конец» закрывает цикл.
    Раздел палитры MakeCode — в квадратных скобках: <code className="font-mono">[Агент] агент ставит блок вниз</code>.
  </>
)

export function CriteriaField({ content, onChange }: { content: StepContent; onChange: (c: StepContent) => void }) {
  return (
    <Field label="Критерии проверки для куратора" hint="Ученик их не видит — они появятся у куратора рядом с работой">
      <Textarea rows={4} value={str(content, 'criteria')} onChange={(e) => onChange({ ...content, criteria: e.target.value })} placeholder="- Программа работает&#10;- Использован цикл, а не копии блоков" />
    </Field>
  )
}

const MODES: { value: FieldMode; label: string }[] = [
  { value: 'required', label: 'обязательно' },
  { value: 'optional', label: 'по желанию' },
  { value: 'off', label: 'не нужно' },
]

/** Что сдаёт ученик: ссылка, скриншот, текст — у каждого поля свой режим */
export function SubmitConfigField({ content, onChange, defaults, linkKind = true }: { content: StepContent; onChange: (c: StepContent) => void; defaults: SubmitConfig; linkKind?: boolean }) {
  const cfg = { ...defaults, ...((content.submit ?? {}) as Partial<SubmitConfig>) }
  const set = (key: keyof SubmitConfig, v: FieldMode) => onChange({ ...content, submit: { ...cfg, [key]: v } })
  const rows: { key: keyof SubmitConfig; label: string }[] = [
    { key: 'link', label: 'Ссылка' },
    { key: 'screenshot', label: 'Скриншот' },
    { key: 'text', label: 'Текст' },
  ]
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">Что сдаёт ученик</div>
      <div className="grid gap-3 sm:grid-cols-4">
        {rows.map((r) => (
          <Field key={r.key} label={r.label}>
            <Select value={cfg[r.key]} onChange={(e) => set(r.key, e.target.value as FieldMode)}>
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        ))}
        {linkKind && (
          <Field label="Куда ведёт ссылка">
            <Select value={str(content, 'link_kind') || 'any'} onChange={(e) => onChange({ ...content, link_kind: e.target.value })}>
              <option value="any">Любой адрес</option>
              <option value="scratch">Проект Scratch</option>
              <option value="makecode">Проект MakeCode</option>
            </Select>
          </Field>
        )}
      </div>
    </div>
  )
}

// ---------- Плеер ----------

/** Загрузка скриншота работы: картинка уходит на сервер, в ответ кладём её адрес */
function ScreenshotField({ value, onChange, required, disabled }: { value: string; onChange: (url: string) => void; required: boolean; disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold">Скриншот{required ? ' *' : ''}</span>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          setBusy(true)
          setError(undefined)
          try {
            const res = await upload<{ url: string }>('/learning/uploads', file)
            onChange(res.url)
          } catch (err) {
            setError(err as Error)
          } finally {
            setBusy(false)
          }
        }}
      />
      {value ? (
        <div className="flex flex-wrap items-end gap-3">
          <img src={mediaUrl(value) ?? value} alt="Твой скриншот" className="max-h-48 rounded-btn border border-brand-line object-contain" />
          {!disabled && (
            <Button type="button" size="sm" variant="secondary" loading={busy} onClick={() => input.current?.click()}>
              Заменить
            </Button>
          )}
        </div>
      ) : (
        <Button type="button" variant="secondary" loading={busy} disabled={disabled} onClick={() => input.current?.click()}>
          <Icon name="image" size={18} />
          Прикрепить скриншот
        </Button>
      )}
      <span className="mt-1.5 block text-sm text-brand-ink-3">PNG или JPG до 5 МБ. В Minecraft — клавиша F2 или «Камера» в инвентаре.</span>
      {error && (
        <div className="mt-2">
          <ErrorBox error={error} />
        </div>
      )}
    </div>
  )
}

interface ManualFormProps {
  stepId: string
  busy: boolean
  canSubmit: boolean
  submit: (a: Answers) => void
  config: SubmitConfig
  /** scratch | makecode | any — подпись и проверка адреса */
  linkKind?: string
  textLabel?: string
  textPlaceholder?: string
  extra?: Answers
  extraValid?: boolean
  children?: ReactNode
}

/** Форма сдачи работы на ручную проверку: ссылка, скриншот, текст — по настройке шага */
export function ManualSubmitForm({
  stepId,
  busy,
  canSubmit,
  submit,
  config,
  linkKind = 'any',
  textLabel = 'Комментарий к работе',
  textPlaceholder = 'Расскажи, что сделал и почему',
  extra,
  extraValid = true,
  children,
}: ManualFormProps) {
  // Черновик не очищаем после отправки: если куратор вернёт работу, ученик дорабатывает её, а не пишет заново
  const [draft, setDraft] = useDraft(stepId, { text: '', link: '', screenshot_url: '' })
  const lk = linkKinds[linkKind] ?? linkKinds.any
  const link = draft.link.trim()
  const linkFormatOk = !link || (isUrl(link) && (!lk.pattern || lk.pattern.test(link)))
  const need = (mode: FieldMode, value: string) => mode !== 'required' || !!value.trim()
  const valid =
    extraValid &&
    linkFormatOk &&
    need(config.link, link) &&
    need(config.screenshot, draft.screenshot_url ?? '') &&
    need(config.text, draft.text) &&
    !!(link || draft.text.trim() || draft.screenshot_url)

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        const answers: Answers = { ...extra }
        if (draft.text.trim()) answers.text = draft.text.trim()
        if (link) answers.link = link
        if (draft.screenshot_url) answers.screenshot_url = draft.screenshot_url
        submit(answers)
      }}
    >
      {children}
      {config.link !== 'off' && (
        <Field
          label={lk.label + (config.link === 'required' ? ' *' : '')}
          hint={!linkFormatOk ? <span className="text-brand-amber-text">{lk.pattern ? lk.hint : 'Ссылка должна начинаться с http:// или https://'}</span> : lk.hint}
        >
          <Input type="url" value={draft.link} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder={lk.placeholder} disabled={!canSubmit} />
        </Field>
      )}
      {config.screenshot !== 'off' && (
        <ScreenshotField value={draft.screenshot_url ?? ''} onChange={(screenshot_url) => setDraft({ ...draft, screenshot_url })} required={config.screenshot === 'required'} disabled={!canSubmit} />
      )}
      {config.text !== 'off' && (
        <Field label={textLabel + (config.text === 'required' ? ' *' : '')}>
          <Textarea rows={4} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder={textPlaceholder} disabled={!canSubmit} />
        </Field>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={busy} disabled={!canSubmit || !valid}>
          Отправить на проверку
        </Button>
        <span className="text-sm text-brand-ink-2">Работу посмотрит куратор. Дальше можно идти, не дожидаясь проверки.</span>
      </div>
    </form>
  )
}

export function DefaultReviewView({ payload }: { payload: Answers }) {
  const text = str(payload, 'text')
  const link = str(payload, 'link')
  const shot = str(payload, 'screenshot_url')
  return (
    <div className="space-y-4">
      {link && (
        <div>
          <div className="eyebrow text-brand-ink-3">Ссылка на результат</div>
          <a href={link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 break-all text-brand-blue underline">
            {link}
            <Icon name="external" size={14} />
          </a>
        </div>
      )}
      {shot && (
        <div>
          <div className="eyebrow mb-1 text-brand-ink-3">Скриншот</div>
          <a href={mediaUrl(shot) ?? shot} target="_blank" rel="noreferrer noopener">
            <img src={mediaUrl(shot) ?? shot} alt="Скриншот ученика" className="max-h-96 rounded-btn border border-brand-line object-contain" />
          </a>
        </div>
      )}
      {text && text !== link && (
        <div>
          <div className="eyebrow text-brand-ink-3">Комментарий ученика</div>
          <div className="mt-1 rounded-field bg-brand-mist p-4 text-sm whitespace-pre-wrap">{text}</div>
        </div>
      )}
      {!text && !link && !shot && <div className="text-sm text-brand-ink-2">Пустой ответ</div>}
    </div>
  )
}
