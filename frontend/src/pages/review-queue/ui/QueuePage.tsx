import { useState } from 'react'
import { LagBadge, lagApi } from '@/entities/lag'
import { useUser } from '@/entities/session'
import { StepTypeIcon, resolveStepType } from '@/entities/step'
import { QueueTable, submissionApi } from '@/entities/submission'
import { CourseFilter } from '@/features/filter-by-course'
import { useAsync } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Loader, PageHeader, Pager } from '@/shared/ui'

const LIMIT = 20

export function QueuePage() {
  const user = useUser()
  const [courseId, setCourseId] = useState('')
  const [offset, setOffset] = useState(0)
  const { data, error, loading, reload } = useAsync(() => submissionApi.queue({ course_id: courseId || undefined, limit: LIMIT, offset }), [courseId, offset])
  // Уровень отставания рядом с именем: куратор сразу видит, чью работу проверить в первую очередь.
  // В очереди только ручная проверка, поэтому тип шага ищем среди kind=task
  const lag = useAsync(() => lagApi.students({ limit: 100 }), [])
  const lagMap = new Map((lag.data?.items ?? []).map((i) => [`${i.student.id}:${i.course_id}`, i.lag_level]))

  return (
    <>
      <PageHeader
        title="Очередь проверки"
        subtitle={data ? `Ждут проверки: ${data.total}. Сначала — те, кто ждёт дольше` : 'Работы, которые нельзя проверить автоматически'}
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
          <EmptyState icon="check" title="Очередь пуста. Все работы проверены.">
            Новые работы появятся здесь автоматически.
          </EmptyState>
        ) : (
          <Card className="overflow-hidden">
            <QueueTable stepIcon={(it) => <StepTypeIcon type={resolveStepType('task', it.step_type)} size="sm" />} items={data.items} studentMeta={(it) => (lag.data ? <LagBadge level={lagMap.get(`${it.student.id}:${it.course_id}`) ?? 'ok'} /> : null)} />
          </Card>
        ))}
      {data && <Pager total={data.total} limit={LIMIT} offset={offset} onChange={setOffset} />}
    </>
  )
}
