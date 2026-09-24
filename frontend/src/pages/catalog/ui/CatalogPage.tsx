import { courseApi } from '@/entities/course'
import { CatalogCourseCard } from '@/widgets/course-card'
import { useAsync } from '@/shared/lib'
import { EmptyState, ErrorBox, Loader, PageHeader } from '@/shared/ui'

export function CatalogPage() {
  const { data, error, loading, reload } = useAsync(() => courseApi.catalog(), [])
  return (
    <>
      <PageHeader title="Каталог курсов" subtitle="Программы подготовки по спортивному программированию для 1–9 классов" />
      {loading && !data && <Loader />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="Опубликованных курсов пока нет" />}
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
