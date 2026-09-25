import { useUser } from '@/entities/session'
import { courseApi } from '@/entities/course'
import { CatalogCourseCard } from '@/widgets/course-card'
import { useAsync } from '@/shared/lib'
import { EmptyState, ErrorBox, Loader, PageHeader } from '@/shared/ui'

export function CatalogPage() {
  const user = useUser()
  const { data, error, loading, reload } = useAsync(() => courseApi.catalog(), [])
  return (
    <>
      <PageHeader
        title={user.role === 'student' ? 'Курсы' : 'Опубликованные курсы'}
        subtitle={user.role === 'student' ? 'Выбери курс — начать можно прямо сейчас' : 'Программы подготовки для 1–9 классов, которые видят ученики'}
      />
      {loading && !data && <Loader />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState icon="grid" title="Опубликованных курсов пока нет" />}
      {data && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((c) => (
            <CatalogCourseCard key={c.id} course={c} onEnrolled={reload} />
          ))}
        </div>
      )}
    </>
  )
}
