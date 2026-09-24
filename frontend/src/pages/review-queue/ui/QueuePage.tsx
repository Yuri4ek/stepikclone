import { useState } from 'react'
import { useUser } from '@/entities/session'
import { QueueRow, submissionApi } from '@/entities/submission'
import { CourseFilter } from '@/features/filter-by-course'
import { useAsync } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Loader, PageHeader, Pager } from '@/shared/ui'

const LIMIT = 20

export function QueuePage() {
  const user = useUser()
  const [courseId, setCourseId] = useState('')
  const [offset, setOffset] = useState(0)
  const { data, error, loading, reload } = useAsync(() => submissionApi.queue({ course_id: courseId || undefined, limit: LIMIT, offset }), [courseId, offset])

  return (
    <>
      <PageHeader
        title="Очередь проверки"
        subtitle={data ? `Ожидают проверки: ${data.total}` : 'Работы, которые нельзя проверить автоматически'}
        actions={
          <CourseFilter
            role={user.role}
            value={courseId}
            onChange={(v) => {
              setCourseId(v)
              setOffset(0)
            }}
          />
        }
      />
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (data.items.length === 0 ? (
          <EmptyState icon="✅" title="Очередь пуста">
            Все работы проверены. Новые появятся здесь автоматически.
          </EmptyState>
        ) : (
          <Card className="flex flex-col gap-1 p-2">
            {data.items.map((it) => (
              <QueueRow key={it.submission_id} item={it} />
            ))}
          </Card>
        ))}
      {data && <Pager total={data.total} limit={LIMIT} offset={offset} onChange={setOffset} />}
    </>
  )
}
