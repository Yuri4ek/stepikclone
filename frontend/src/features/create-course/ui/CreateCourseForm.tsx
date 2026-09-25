import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { slugify } from '@/shared/lib'
import { Button, Card, ErrorBox, Field, Input, Textarea } from '@/shared/ui'
import { createCourseApi } from '../api/createCourseApi'

export function CreateCourseForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', slug: '', description: '' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()

  return (
    <Card className="mb-6 p-6">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError(undefined)
          try {
            const c = await createCourseApi.create({ ...form, title: form.title.trim(), description: form.description.trim() })
            navigate(`/admin/courses/${c.id}`)
          } catch (err) {
            setError(err as Error)
            setBusy(false)
          }
        }}
      >
        <h2 className="text-lg font-bold">Новый курс</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Название">
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugTouched ? form.slug : slugify(e.target.value) })}
              placeholder="Scratch для начинающих"
            />
          </Field>
          <Field label="Адрес (slug)" hint="Латиница, цифры и дефис">
            <Input
              required
              pattern="[a-z0-9-]+"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setForm({ ...form, slug: e.target.value })
              }}
              placeholder="scratch-start"
            />
          </Field>
        </div>
        <Field label="Описание">
          <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Для кого курс и чему он научит" />
        </Field>
        {error && <ErrorBox error={error} />}
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>
            Создать и перейти к сборке
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
    </Card>
  )
}
