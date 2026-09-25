import { useRef, useState } from 'react'
import { courseCoverStyle } from '@/entities/course'
import type { AdminCourseTree } from '@/shared/api'
import { useAsync } from '@/shared/lib'
import { Button, Card, Field, Input, Notice, Select, StatusPill, Textarea } from '@/shared/ui'
import { manageCourseApi } from '../api/manageCourseApi'

/** Настройки курса: название и описание, обложка, публикация, назначение куратора */
export function CourseSettings({ tree, onChanged }: { tree: AdminCourseTree; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState({ title: tree.title, description: tree.description })
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [curatorId, setCuratorId] = useState('')
  const curators = useAsync(() => manageCourseApi.users('curator'), [])
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
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
          <p className="mt-2 text-sm text-brand-ink-2">Курс виден ученикам в каталоге. Опубликованный курс можно менять: правки шагов применяются сразу, прогресс учеников сохраняется.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-brand-ink-2">Черновик виден только администраторам. В курсе <span className="num">{stepsCount}</span> шагов.</p>
            <Button className="mt-3" disabled={stepsCount === 0} onClick={() => run('publish', () => manageCourseApi.publish(tree.id), 'Курс опубликован')} loading={busy === 'publish'}>
              Опубликовать курс
            </Button>
          </>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-bold">Назначить куратора</h2>
        <p className="mt-1 text-sm text-brand-ink-2">Куратор увидит работы и отстающих учеников этого курса.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void run('curator', () => manageCourseApi.assignCurator(tree.id, curatorId), 'Куратор назначен').then(() => setCuratorId(''))
          }}
        >
          <Select required value={curatorId} onChange={(e) => setCuratorId(e.target.value)} aria-label="Куратор">
            <option value="">{curators.loading ? 'Загрузка…' : 'Выберите куратора'}</option>
            {curators.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} · {u.email}
              </option>
            ))}
          </Select>
          <Button type="submit" loading={busy === 'curator'} disabled={!curatorId}>
            Назначить
          </Button>
        </form>
      </Card>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  )
}
