import { useState } from 'react'
import { LagBadge, lagApi, lagMeta, type LagState } from '@/entities/lag'
import { useUser } from '@/entities/session'
import { Avatar } from '@/entities/user'
import { CourseFilter } from '@/features/filter-by-course'
import type { LagItem } from '@/shared/api'
import { cx, formatPercent, relativeDay, useAsync } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Icon, Loader, PageHeader, ProgressBar, Segmented } from '@/shared/ui'

const signalIcon = { inactive: 'clock', stalled: 'alert', stuck: 'x', returned_idle: 'undo', behind: 'chart' } as const

function Signals({ it }: { it: LagItem }) {
  if (!it.signals.length) return <div className="text-brand-ink-2">{it.reason}</div>
  return (
    <ul className="space-y-1">
      {it.signals.map((s, i) => (
        <li key={i} className={cx('flex items-start gap-2', s.level === 'critical' ? 'text-st-failed' : 'text-brand-ink')}>
          <Icon name={signalIcon[s.code as keyof typeof signalIcon] ?? 'alert'} size={16} className="mt-0.5 shrink-0" />
          {s.text}
        </li>
      ))}
    </ul>
  )
}

/**
 * Ученики курсов куратора и три уровня отставания (брендбук, раздел 03). Сигналы считает бэкенд —
 * в том числе ранние: заходит, но не продвигается; застрял; не исправляет возвращённую работу; отстаёт от группы.
 */
export function LagPage() {
  const user = useUser()
  const [courseId, setCourseId] = useState('')
  const [level, setLevel] = useState<LagState | 'all'>('all')
  const { data, error, loading, reload } = useAsync(() => lagApi.students({ course_id: courseId || undefined, include_ok: true, limit: 500 }), [courseId])

  const all = data?.items ?? []
  const rows = all.filter((r) => level === 'all' || r.lag_level === level)
  const count = (l: LagState) => all.filter((r) => r.lag_level === l).length

  return (
    <>
      <PageHeader title="Ученики" subtitle="Кто замедлился или выпадает — напишите им раньше, чем они перестанут заходить" actions={<CourseFilter role={user.role} value={courseId} onChange={setCourseId} />} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented<LagState | 'all'>
          value={level}
          onChange={setLevel}
          options={[
            { value: 'all', label: `Все · ${all.length}` },
            { value: 'critical', label: `Выпадает · ${count('critical')}` },
            { value: 'warning', label: `Замедлился · ${count('warning')}` },
            { value: 'ok', label: `В графике · ${count('ok')}` },
          ]}
        />
      </div>
      <div className="mb-4 grid gap-2 text-xs text-brand-ink-3 md:grid-cols-2">
        {(['critical', 'warning'] as const).map((l) => (
          <span key={l}>
            <b className={lagMeta[l].cls}>{lagMeta[l].label}</b> — {lagMeta[l].hint}
          </span>
        ))}
      </div>

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (rows.length === 0 ? (
          <EmptyState icon="users" title={level === 'all' ? 'Учеников пока нет' : 'В этой группе никого'}>
            {level === 'all' && 'Ученики появятся, когда администратор назначит вас на курс и на него запишутся.'}
          </EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-brand-line bg-brand-mist text-left">
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">Ученик</th>
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">Что происходит</th>
                  <th className="eyebrow w-44 px-4 py-3 text-brand-ink-3">Прогресс</th>
                  <th className="eyebrow px-4 py-3 text-right text-brand-ink-3">Вход · продвижение</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.enrollment_id} className="border-b border-brand-line last:border-0">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.student.full_name} size="sm" />
                        <div>
                          <div className="font-semibold">{r.student.full_name}</div>
                          <LagBadge level={r.lag_level} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Signals it={r} />
                      <div className="mt-1 text-xs text-brand-ink-3">
                        {r.course_title}
                        {r.current_step_title && ` · сейчас: «${r.current_step_title}»`}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="num font-semibold">{formatPercent(r.percent)}</div>
                      <ProgressBar value={r.percent} className="mt-1" />
                    </td>
                    <td className="num px-4 py-3 text-right align-top whitespace-nowrap text-brand-ink-2">
                      <div>{relativeDay(r.last_seen_at) || '—'}</div>
                      <div className="text-xs text-brand-ink-3">сдавал {relativeDay(r.last_progress_at) || '—'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
    </>
  )
}
