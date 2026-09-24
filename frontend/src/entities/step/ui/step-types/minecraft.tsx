import { useState } from 'react'
import { Button, Field, Input, Markdown } from '@/shared/ui'
import { list, str } from '../../lib/content'
import { Criteria, CriteriaField, DefaultReviewView, ManualSubmitForm, MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

function ChecklistEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium">Чек-лист задания в мире</div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Например: построить мост через реку" />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="px-2 text-content-secondary hover:text-status-error" aria-label="Удалить пункт">
              ✕
            </button>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => onChange([...items, ''])}>
        + Пункт
      </Button>
    </div>
  )
}

export const minecraftStep: StepTypeDef = {
  id: 'minecraft',
  kind: 'task',
  label: 'Minecraft Education',
  description: 'Шаг, привязанный к заданию внутри мира Minecraft Education: код мира, чек-лист, отчёт скриншотом. Проверяет куратор.',
  icon: '⛏️',
  color: '#16A34A',
  check: 'manual',
  defaultMaxScore: 20,
  defaultContent: () => ({ type: 'minecraft', markdown: '', world_name: '', world_link: '', join_code: '', checklist: [''], criteria: '' }),
  validate: (c) => (str(c, 'markdown').trim() ? null : 'Опишите задание'),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Задание" rows={6} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Название мира / урока">
          <Input value={str(content, 'world_name')} onChange={(e) => onChange({ ...content, world_name: e.target.value })} placeholder="Агент строит дом" />
        </Field>
        <Field label="Код подключения">
          <Input value={str(content, 'join_code')} onChange={(e) => onChange({ ...content, join_code: e.target.value })} placeholder="🐔🌵🐟🍎" />
        </Field>
        <Field label="Ссылка на мир / урок">
          <Input value={str(content, 'world_link')} onChange={(e) => onChange({ ...content, world_link: e.target.value })} placeholder="https://education.minecraft.net/…" />
        </Field>
      </div>
      <ChecklistEditor items={list<string>(content, 'checklist')} onChange={(checklist) => onChange({ ...content, checklist })} />
      <CriteriaField content={content} onChange={onChange} />
    </div>
  ),

  Player: function MinecraftPlayer({ step, content, busy, canSubmit, submit }) {
    const checklist = list<string>(content, 'checklist').filter((s) => s.trim())
    const [done, setDone] = useState<boolean[]>(() => checklist.map(() => false))
    const worldName = str(content, 'world_name')
    const joinCode = str(content, 'join_code')
    const worldLink = str(content, 'world_link')
    return (
      <div className="space-y-5">
        {(worldName || joinCode || worldLink) && (
          <div className="rounded-3xl bg-gradient-to-br from-green-500/18 to-emerald-300/8 p-6">
            <div className="text-sm font-medium text-green-700">Задание в мире Minecraft Education</div>
            {worldName && <div className="mt-1 text-xl font-medium">{worldName}</div>}
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              {joinCode && (
                <span>
                  Код подключения: <span className="rounded-full bg-white/80 px-3 py-1 font-mono text-base font-medium">{joinCode}</span>
                </span>
              )}
              {worldLink && (
                <a href={worldLink} target="_blank" rel="noreferrer noopener" className="rounded-full bg-white/70 px-3 py-1 font-medium text-green-700">
                  Открыть мир ↗
                </a>
              )}
            </div>
          </div>
        )}
        <Markdown>{str(content, 'markdown')}</Markdown>
        <Criteria content={content} />
        <ManualSubmitForm
          stepId={step.id}
          busy={busy}
          canSubmit={canSubmit}
          submit={submit}
          linkLabel="Ссылка на скриншот или видео результата"
          linkPlaceholder="https://disk.yandex.ru/…"
          linkRequired
          textLabel="Что получилось в мире"
          extra={{ checklist: checklist.map((item, i) => ({ item, done: done[i] })) }}
          extraValid={done.every(Boolean)}
        >
          {checklist.length > 0 && (
            <fieldset className="space-y-2" disabled={!canSubmit}>
              <legend className="mb-2 text-sm font-medium">Отметьте, что выполнено в мире</legend>
              {checklist.map((item, i) => (
                <label key={i} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-green-500/8 px-4 py-3 hover:bg-green-500/12">
                  <input type="checkbox" className="size-4 accent-step-minecraft" checked={done[i] ?? false} onChange={(e) => setDone(done.map((d, j) => (j === i ? e.target.checked : d)))} />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </fieldset>
          )}
        </ManualSubmitForm>
      </div>
    )
  },

  ReviewView: ({ payload }) => {
    const checklist = list<{ item: string; done: boolean }>(payload, 'checklist')
    return (
      <div className="space-y-4">
        {checklist.length > 0 && (
          <ul className="space-y-1 text-sm">
            {checklist.map((c, i) => (
              <li key={i}>
                {c.done ? '✅' : '⬜'} {c.item}
              </li>
            ))}
          </ul>
        )}
        <DefaultReviewView payload={payload} />
      </div>
    )
  },
}
