import { useState } from 'react'
import { LagBadge, lagApi, lagMeta, lagSentence, type LagState } from '@/entities/lag'
import { useUser } from '@/entities/session'
import { submissionApi } from '@/entities/submission'
import { Avatar, userApi } from '@/entities/user'
import { CourseFilter } from '@/features/filter-by-course'
import { formatDate, formatPercent, useAsync } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Loader, Notice, PageHeader, ProgressBar, Segmented } from '@/shared/ui'

interface StudentRow {
  key: string
  name: string
  email?: string
  level: LagState
  course?: string
  percent?: number
  sentence: string
  lastSeen?: string | null
}

/**
 * Ученики и три уровня отставания (брендбук, раздел 03). API /lag/students отдаёт только отстающих,
 * поэтому «В графике» собираем из других источников: администратору — все ученики из /admin/users,
 * куратору — ученики, которые сдают работы в очередь.
 */
async function load(isAdmin: boolean, courseId: string): Promise<{ rows: StudentRow[]; partial: boolean }> {
  const [lag, queue, all] = await Promise.all([
    lagApi.students({ course_id: courseId || undefined, limit: 100 }),
    submissionApi.queue({ course_id: courseId || undefined, limit: 100 }),
    isAdmin && !courseId ? userApi.list('student') : Promise.resolve(null),
  ])
  const rows: StudentRow[] = lag.items.map((it) => ({
    key: it.enrollment_id,
    name: it.student.full_name,
    email: it.student.email,
    level: it.lag_level,
    course: it.course_title,
    percent: it.percent,
    sentence: lagSentence(it),
    lastSeen: it.last_seen_at,
  }))
  const lagging = new Set(lag.items.map((i) => i.student.id))
  const seen = new Set<string>()
  for (const q of queue.items) {
    if (lagging.has(q.student.id) || seen.has(q.student.id)) continue
    seen.add(q.student.id)
    rows.push({ key: `q-${q.student.id}`, name: q.student.full_name, email: q.student.email, level: 'ok', course: q.course_title, sentence: `Работа «${q.step_title}» ждёт проверки` })
  }
  for (const u of all ?? []) {
    if (lagging.has(u.id) || seen.has(u.id)) continue
    rows.push({ key: `u-${u.id}`, name: u.full_name, email: u.email, level: 'ok', sentence: 'Отставания нет' })
  }
  return { rows, partial: !isAdmin || !!courseId }
}

const order: Record<LagState, number> = { critical: 0, warning: 1, ok: 2 }

export function LagPage() {
  const user = useUser()
  const [courseId, setCourseId] = useState('')
  const [level, setLevel] = useState<LagState | 'all'>('all')
  const { data, error, loading, reload } = useAsync(() => load(user.role === 'admin', courseId), [user.role, courseId])

  const rows = (data?.rows ?? []).filter((r) => level === 'all' || r.level === level).sort((a, b) => order[a.level] - order[b.level])
  const count = (l: LagState) => data?.rows.filter((r) => r.level === l).length ?? 0

  return (
    <>
      <PageHeader title="Ученики" subtitle="Кто замедлился или выпадает — напишите им раньше, чем они перестанут заходить" actions={<CourseFilter role={user.role} value={courseId} onChange={setCourseId} />} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented<LagState | 'all'>
          value={level}
          onChange={setLevel}
          options={[
            { value: 'all', label: 'Все' },
            { value: 'critical', label: `Выпадает · ${count('critical')}` },
            { value: 'warning', label: `Замедлился · ${count('warning')}` },
            { value: 'ok', label: `В графике · ${count('ok')}` },
          ]}
        />
        <div className="flex flex-wrap gap-4 text-xs text-brand-ink-3">
          {(['critical', 'warning'] as const).map((l) => (
            <span key={l}>
              <b className={lagMeta[l].cls}>{lagMeta[l].label}</b> — {lagMeta[l].hint.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (rows.length === 0 ? (
          <EmptyState icon="users" title={level === 'all' ? 'Учеников пока нет' : 'В этой группе никого'} />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className="border-b border-brand-line bg-brand-mist text-left">
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">Ученик</th>
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">Что происходит</th>
                  <th className="eyebrow w-44 px-4 py-3 text-brand-ink-3">Прогресс</th>
                  <th className="eyebrow px-4 py-3 text-right text-brand-ink-3">Последний вход</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-brand-line last:border-0">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} size="sm" />
                        <div>
                          <div className="font-semibold">{r.name}</div>
                          <LagBadge level={r.level} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div>{r.sentence}</div>
                      {r.course && <div className="text-xs text-brand-ink-3">{r.course}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {r.percent !== undefined ? (
                        <>
                          <div className="num font-semibold">{formatPercent(r.percent)}</div>
                          <ProgressBar value={r.percent} className="mt-1" />
                        </>
                      ) : (
                        <span className="text-brand-ink-3">—</span>
                      )}
                    </td>
                    <td className="num px-4 py-3 text-right align-top text-brand-ink-2">{r.lastSeen ? formatDate(r.lastSeen) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      {data?.partial && (
        <Notice className="mt-4">
          «В графике» здесь — ученики, которые сейчас сдают работы. Полного списка закреплённых учеников в API пока нет: бэкенд отдаёт только отстающих.
        </Notice>
      )}
    </>
  )
}
