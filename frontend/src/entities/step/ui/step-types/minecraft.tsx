import { useState } from 'react'
import { Button, Field, Icon, Input, Markdown } from '@/shared/ui'
import { list, str, submitConfig, type SubmitConfig } from '../../lib/content'
import { BLOCKS_HINT, CriteriaField, DefaultReviewView, ManualSubmitForm, MarkdownField, SubmitConfigField } from '../common'
import type { StepTypeDef } from '../../model/types'

function ChecklistEditor({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">Чек-лист для ученика (необязательно)</div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} placeholder="Например: дорожка ровно из 10 блоков" />
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-2 text-brand-ink-3 hover:text-brand-ink" aria-label="Удалить пункт">
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => onChange([...items, ''])}>
        <Icon name="plus" size={16} />
        Пункт
      </Button>
    </div>
  )
}

const MC_SUBMIT: SubmitConfig = { link: 'required', screenshot: 'required', text: 'optional' }


export const minecraftStep: StepTypeDef = {
  id: 'minecraft',
  kind: 'task',
  label: 'Minecraft Education',
  description: 'Задание в мире Minecraft, программа из блоков MakeCode. Ученик сдаёт скриншот и ссылку на проект, проверяет куратор.',
  group: 'Minecraft Education',
  icon: 'cube',
  check: 'manual',
  defaultMaxScore: 15,
  defaultContent: () => ({ type: 'minecraft', world: '', markdown: '', join_code: '', world_link: '', checklist: [], criteria: '', submit: MC_SUBMIT, link_kind: 'makecode' }),
  validate: (c) => (str(c, 'markdown').trim() ? null : 'Опишите задание'),

  Editor: ({ content, onChange }) => (
    <div className="space-y-4">
      <MarkdownField label="Мир: как подготовить" rows={3} value={str(content, 'world')} onChange={(world) => onChange({ ...content, world })} hint="Например: плоский мир, творческий режим, 12 свободных блоков впереди" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Код подключения к миру (необязательно)">
          <Input value={str(content, 'join_code')} onChange={(e) => onChange({ ...content, join_code: e.target.value })} placeholder="Курица, кактус, рыба, яблоко" />
        </Field>
        <Field label="Ссылка на готовый мир (необязательно)">
          <Input value={str(content, 'world_link')} onChange={(e) => onChange({ ...content, world_link: e.target.value })} placeholder="https://education.minecraft.net/…" />
        </Field>
      </div>
      <MarkdownField label="Задание" rows={12} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} hint={BLOCKS_HINT} />
      <ChecklistEditor items={list<string>(content, 'checklist')} onChange={(checklist) => onChange({ ...content, checklist })} />
      <SubmitConfigField content={content} onChange={onChange} defaults={MC_SUBMIT} />
      <CriteriaField content={content} onChange={onChange} />
    </div>
  ),

  Player: function MinecraftPlayer({ step, content, busy, canSubmit, submit }) {
    const checklist = list<string>(content, 'checklist').filter((s) => s.trim())
    const [done, setDone] = useState<boolean[]>(() => checklist.map(() => false))
    const world = str(content, 'world')
    const joinCode = str(content, 'join_code')
    const worldLink = str(content, 'world_link')
    return (
      <div className="space-y-6">
        {(world || joinCode || worldLink) && (
          <div className="rounded-card border border-brand-line bg-brand-mist p-6">
            <div className="eyebrow flex items-center gap-1.5 text-brand-ink-3">
              <Icon name="cube" size={16} />
              Мир
            </div>
            {world && <Markdown className="mt-2">{world}</Markdown>}
            {(joinCode || worldLink) && (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {joinCode && (
                  <span>
                    Код подключения: <span className="rounded-field border border-brand-line bg-white px-3 py-1 font-mono font-semibold">{joinCode}</span>
                  </span>
                )}
                {worldLink && (
                  <a href={worldLink} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 font-semibold text-brand-blue hover:underline">
                    Открыть мир
                    <Icon name="external" size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
        <Markdown>{str(content, 'markdown')}</Markdown>
        <ManualSubmitForm
          stepId={step.id}
          busy={busy}
          canSubmit={canSubmit}
          submit={submit}
          config={submitConfig(content, MC_SUBMIT)}
          linkKind={str(content, 'link_kind') || 'makecode'}
          textLabel="Что получилось в мире"
          extra={checklist.length ? { checklist: checklist.map((item, i) => ({ item, done: done[i] })) } : undefined}
          extraValid={done.every(Boolean)}
        >
          {checklist.length > 0 && (
            <fieldset className="space-y-2" disabled={!canSubmit}>
              <legend className="mb-2 text-sm font-semibold">Отметь, что уже сделано в мире</legend>
              {checklist.map((item, i) => (
                <label key={i} className="flex cursor-pointer items-center gap-3 rounded-btn border border-brand-line bg-white px-4 py-3 hover:border-brand-blue-200">
                  <input type="checkbox" className="size-5 accent-[#3457F0]" checked={done[i] ?? false} onChange={(e) => setDone(done.map((d, j) => (j === i ? e.target.checked : d)))} />
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
              <li key={i} className="flex items-center gap-2">
                <Icon name={c.done ? 'check' : 'x'} size={16} className={c.done ? 'text-st-done' : 'text-brand-ink-3'} />
                {c.item}
              </li>
            ))}
          </ul>
        )}
        <DefaultReviewView payload={payload} />
      </div>
    )
  },
}
