import { useRef, useState } from 'react'
import { courseCoverStyle } from '@/entities/course'
import type { AdminCourseTree, CoursePassport } from '@/shared/api'
import { Button, Card, Field, Input, Notice, StatusPill, Textarea } from '@/shared/ui'
import { manageCourseApi } from '../api/manageCourseApi'
import { CoursePeople } from './CoursePeople'

const passportFields: { key: keyof CoursePassport; label: string; placeholder: string }[] = [
  { key: 'grades', label: 'Классы', placeholder: '2–4 класс' },
  { key: 'volume', label: 'Объём', placeholder: '6–8 занятий по 40 минут' },
  { key: 'tool', label: 'Инструмент', placeholder: 'Scratch 3' },
]


export function CourseSettings({ tree, onChanged }: { tree: AdminCourseTree; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState({ title: tree.title, description: tree.description, passport: tree.passport ?? {} })
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const coverInput = useRef<HTMLInputElement>(null)
  const stepsCount = tree.modules.flatMap((m) => m.lessons.flatMap((l) => l.steps)).length

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key)
    setMsg(null)
    try {
      await fn()
      await onChanged()
      setMsg({ tone: 'success', text: ok })
    } catch (e) {
      setMsg({ tone: 'error', text: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-bold">Настройки курса</h2>
        <Field label="Название">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Описание">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          {passportFields.map((f) => (
            <Field key={f.key} label={f.label}>
              <Input value={form.passport[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, passport: { ...form.passport, [f.key]: e.target.value } })} />
            </Field>
          ))}
        </div>
        <Field label="Цель курса">
          <Textarea rows={2} value={form.passport.goal ?? ''} onChange={(e) => setForm({ ...form, passport: { ...form.passport, goal: e.target.value } })} />
        </Field>
        <Button onClick={() => run('save', () => manageCourseApi.update(tree.id, form), 'Изменения сохранены')} loading={busy === 'save'}>
          Сохранить
        </Button>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold">Обложка</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="h-24 w-44 shrink-0 rounded-btn" style={courseCoverStyle(tree)} aria-label="Текущая обложка" />
          <div className="space-y-2">
            <input
              ref={coverInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void run('cover', () => manageCourseApi.uploadCover(tree.id, file), 'Обложка обновлена')
              }}
            />
            <Button variant="secondary" loading={busy === 'cover'} onClick={() => coverInput.current?.click()}>
              Загрузить картинку
            </Button>
            <p className="text-xs text-brand-ink-3">PNG, JPG, WEBP или GIF до 5 МБ. Без картинки используется фирменный цвет.</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">Публикация</h2>
          <StatusPill tone={tree.status === 'published' ? 'done' : 'idle'} label={tree.status === 'published' ? 'Опубликован' : 'Черновик'} />
        </div>
        {tree.status === 'published' ? (
          <>
            <p className="mt-2 text-sm text-brand-ink-2">Курс виден ученикам в каталоге. Опубликованный курс можно менять: правки шагов применяются сразу, прогресс учеников сохраняется.</p>
            <Button className="mt-3" variant="secondary" onClick={() => confirm('Снять курс с публикации? Он пропадёт из каталога, но записанные ученики продолжат обучение.') && void run('unpublish', () => manageCourseApi.unpublish(tree.id), 'Курс снят с публикации')} loading={busy === 'unpublish'}>
              Снять с публикации
            </Button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-brand-ink-2">Черновик виден только администраторам. В курсе <span className="num">{stepsCount}</span> шагов.</p>
            <Button className="mt-3" disabled={stepsCount === 0} onClick={() => run('publish', () => manageCourseApi.publish(tree.id), 'Курс опубликован')} loading={busy === 'publish'}>
              Опубликовать курс
            </Button>
          </>
        )}
      </Card>

      <CoursePeople courseId={tree.id} />

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  )
}
