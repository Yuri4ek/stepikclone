import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type CourseStatus } from '../../api'
import { slugify } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'
import { Badge, Button, Card, EmptyState, ErrorBox, Field, Input, Loader, PageHeader, Textarea } from '../../components/ui'
import { courseCover } from '../student/CatalogPage'

export const courseStatusMeta: Record<CourseStatus, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: '#64748B' },
  published: { label: 'Опубликован', color: '#10B981' },
}

function CreateCourse({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', slug: '', description: '' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()

  return (
    <Card className="mb-6 p-6" accent="#7C3AED">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError(undefined)
          try {
            const c = await api.admin.createCourse({ ...form, title: form.title.trim(), description: form.description.trim() })
            navigate(`/admin/courses/${c.id}`)
          } catch (err) {
            setError(err as Error)
            setBusy(false)
          }
        }}
      >
        <h2 className="font-medium">Новый курс</h2>
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

export function AdminCoursesPage() {
  const { data, error, loading, reload } = useAsync(() => api.admin.courses(), [])
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        title="Конструктор курсов"
        subtitle="Собирайте курсы из шагов разных типов и публикуйте их для учеников"
        actions={!creating && <Button onClick={() => setCreating(true)}>+ Новый курс</Button>}
      />
      {creating && <CreateCourse onCancel={() => setCreating(false)} />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (data.length === 0 ? (
          <EmptyState icon="🧱" title="Курсов пока нет">
            Создайте первый курс.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => (
              <Link key={c.id} to={`/admin/courses/${c.id}`}>
                <Card className="h-full overflow-hidden transition-transform hover:-translate-y-1">
                  <div className="m-2 h-20 rounded-[22px]" style={{ backgroundImage: courseCover(c.id) }} />
                  <div className="px-5 pt-2 pb-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium">{c.title}</h3>
                      <Badge color={courseStatusMeta[c.status].color}>{courseStatusMeta[c.status].label}</Badge>
                    </div>
                    <div className="mt-1 font-mono text-xs text-content-secondary">/{c.slug}</div>
                    <p className="mt-2 line-clamp-2 text-sm text-content-secondary">{c.description}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ))}
    </>
  )
}
