import { useState } from 'react'
import { Link } from 'react-router-dom'
import { courseApi, courseCover, courseStatusMeta } from '@/entities/course'
import { CreateCourseForm } from '@/features/create-course'
import { useAsync } from '@/shared/lib'
import { Badge, Button, Card, EmptyState, ErrorBox, Loader, PageHeader } from '@/shared/ui'

export function AdminCoursesPage() {
  const { data, error, loading, reload } = useAsync(() => courseApi.adminList(), [])
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        title="Конструктор курсов"
        subtitle="Собирайте курсы из шагов разных типов и публикуйте их для учеников"
        actions={!creating && <Button onClick={() => setCreating(true)}>+ Новый курс</Button>}
      />
      {creating && <CreateCourseForm onCancel={() => setCreating(false)} />}
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
