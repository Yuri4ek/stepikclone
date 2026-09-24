import { useState } from 'react'
import { LagBadge, lagApi, lagMeta } from '@/entities/lag'
import { useUser } from '@/entities/session'
import { CourseFilter } from '@/features/filter-by-course'
import type { LagLevel } from '@/shared/api'
import { cx, formatDate, formatPercent, plural, useAsync } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Loader, PageHeader, Pager, ProgressBar, Select } from '@/shared/ui'

const LIMIT = 20

export function LagPage() {
  const user = useUser()
  const [courseId, setCourseId] = useState('')
  const [level, setLevel] = useState<LagLevel | ''>('')
  const [offset, setOffset] = useState(0)
  const { data, error, loading, reload } = useAsync(
    () => lagApi.students({ course_id: courseId || undefined, level: level || undefined, limit: LIMIT, offset }),
    [courseId, level, offset],
  )

  return (
    <>
      <PageHeader
        title="Отстающие ученики"
        subtitle="Кто давно не заходил или медленно продвигается — напишите им до того, как они бросят курс"
        actions={
          <>
            <CourseFilter
              role={user.role}
              value={courseId}
              onChange={(v) => {
                setCourseId(v)
                setOffset(0)
              }}
            />
            <Select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as LagLevel | '')
                setOffset(0)
              }}
              className="w-auto"
              aria-label="Уровень"
            >
              <option value="">Все уровни</option>
              <option value="critical">Критично (≥ 7 дней)</option>
              <option value="warning">Внимание (≥ 3 дней)</option>
            </Select>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-content-secondary">
        <span>{lagMeta.warning.icon} Внимание — нет активности 3+ дня или низкий прогресс</span>
        <span>{lagMeta.critical.icon} Критично — нет активности 7+ дней</span>
      </div>

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (data.items.length === 0 ? (
          <EmptyState icon="🎉" title="Отстающих нет">
            Все ученики занимаются регулярно.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {data.items.map((it) => (
              <Card key={it.enrollment_id} accent={lagMeta[it.lag_level].color} className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{it.student.full_name}</span>
                      <LagBadge level={it.lag_level} />
                    </div>
                    <div className="text-xs text-content-secondary">
                      {it.student.email} · {it.course_title}
                    </div>
                    <div className="mt-1 text-sm">{it.reason}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm md:w-[420px]">
                    <div>
                      <div className="text-xs text-content-secondary">Без активности</div>
                      <div className={cx('font-medium', it.lag_level === 'critical' ? 'text-status-error' : 'text-amber-600')}>
                        {it.days_since_activity} {plural(it.days_since_activity, 'день', 'дня', 'дней')}
                      </div>
                      <div className="text-xs text-content-secondary">{formatDate(it.last_seen_at)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-content-secondary">Прогресс</div>
                      <div className="font-medium">{formatPercent(it.percent)}</div>
                      <ProgressBar value={it.percent} className="mt-1" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-content-secondary">Остановился на</div>
                      <div className="truncate font-medium">{it.current_step_title ?? '—'}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
      {data && <Pager total={data.total} limit={LIMIT} offset={offset} onChange={setOffset} />}
    </>
  )
}
