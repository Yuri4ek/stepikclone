import { useState } from 'react'
import { Link } from 'react-router-dom'
import { courseApi, courseCoverStyle, courseStatusMeta } from '@/entities/course'
import { CreateCourseForm } from '@/features/create-course'
import { useAsync } from '@/shared/lib'
import { Badge, Button, Card, EmptyState, ErrorBox, Icon, Loader, PageHeader } from '@/shared/ui'

export function AdminCoursesPage() {
  const { data, error, loading, reload } = useAsync(() => courseApi.adminList(), [])
  const [creating, setCreating] = useState(false)

  return (
    <>
      <PageHeader
        title="Курсы"
        subtitle="Собирайте курсы из шагов разных типов и публикуйте их для учеников"
        actions={
          !creating && (
            <Button onClick={() => setCreating(true)}>
              <Icon name="plus" size={18} />
              Новый курс
            </Button>
          )
        }
      />
      {creating && <CreateCourseForm onCancel={() => setCreating(false)} />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (data.length === 0 ? (
          <EmptyState icon="layers" title="Курсов пока нет">
            Создайте первый курс.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => {
              const st = courseStatusMeta[c.status]
              return (
                <Link key={c.id} to={`/admin/courses/${c.id}`}>
                  <Card className="h-full overflow-hidden transition-colors hover:border-brand-blue-200">
                    <div className="h-16" style={courseCoverStyle(c)} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold">{c.title}</h3>
                        <Badge icon={st.icon} className={st.cls}>
                          {st.label}
                        </Badge>
                      </div>
                      <div className="mt-1 font-mono text-xs text-brand-ink-3">/{c.slug}</div>
                      <p className="mt-2 line-clamp-2 text-sm text-brand-ink-2">{c.description}</p>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        ))}
    </>
  )
}
