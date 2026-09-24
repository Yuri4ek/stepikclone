import { useState } from 'react'
import type { AdminCourseTree } from '@/shared/api'
import { Button, Card, Field, Input, Notice, Textarea } from '@/shared/ui'
import { manageCourseApi } from '../api/manageCourseApi'

/** Настройки курса: название и описание, публикация, назначение куратора */
export function CourseSettings({ tree, onChanged }: { tree: AdminCourseTree; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState({ title: tree.title, description: tree.description })
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [curatorId, setCuratorId] = useState('')
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
        <h2 className="text-lg font-medium">Настройки курса</h2>
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

      <Card className="p-5" accent={tree.status === 'published' ? '#10B981' : '#64748B'}>
        <h2 className="font-medium">Публикация</h2>
        {tree.status === 'published' ? (
          <p className="mt-1 text-sm text-content-secondary">Курс опубликован и виден ученикам в каталоге. Изменения шагов применяются сразу.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-content-secondary">Черновик виден только администраторам. В курсе {stepsCount} шагов.</p>
            <Button className="mt-3" variant="success" disabled={stepsCount === 0} onClick={() => run('publish', () => manageCourseApi.publish(tree.id), 'Курс опубликован')} loading={busy === 'publish'}>
              Опубликовать курс
            </Button>
          </>
        )}
      </Card>

      <Card className="p-5" accent="#0D9488">
        <h2 className="font-medium">Назначить куратора</h2>
        <p className="mt-1 text-sm text-content-secondary">Куратор увидит работы и отстающих учеников этого курса.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void run('curator', () => manageCourseApi.assignCurator(tree.id, curatorId.trim()), 'Куратор назначен').then(() => setCuratorId(''))
          }}
        >
          <Input required value={curatorId} onChange={(e) => setCuratorId(e.target.value)} placeholder="ID пользователя (UUID)" className="font-mono" />
          <Button type="submit" loading={busy === 'curator'}>
            Назначить
          </Button>
        </form>
      </Card>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  )
}
