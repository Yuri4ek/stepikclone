import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type BreakdownItem, type Submission } from '../../api'
import { useUser } from '../../auth/AuthContext'
import { formatDate, formatScore } from '../../lib/format'
import { readLog, type LoggedSubmission } from '../../lib/submissionLog'
import { useAsync } from '../../lib/useAsync'
import { STEP_TYPES, resolveStepType } from '../../steps/registry'
import { StepTypeIcon } from '../../components/StepTypeBadge'
import { Badge, Card, EmptyState, ErrorBox, List, Loader, PageHeader, ScorePill, Segmented } from '../../components/ui'

type Row = LoggedSubmission & { sub: Submission | null }
type Filter = 'all' | 'pending' | 'returned' | 'graded'

const subStatus = {
  pending: { label: 'На проверке', color: '#D97706' },
  graded: { label: 'Проверено', color: '#059669' },
  returned: { label: 'Возвращено', color: '#EF4444' },
}

async function load(userId: string) {
  const log = readLog(userId).slice(0, 60)
  const subs = await Promise.all(log.map((e) => api.learning.submission(e.submission_id).catch(() => null)))
  const rows: Row[] = log.map((e, i) => ({ ...e, sub: subs[i] }))

  // Засчитанные задания — с сервера, по всем курсам ученика (видны с любого устройства)
  const catalog = await api.catalog.courses()
  const mine = catalog.items.filter((c) => c.enrollment)
  const progress = await Promise.all(mine.map((c) => api.progress.course(c.id).catch(() => null)))
  const passed = mine.flatMap((c, i) => (progress[i]?.rating.breakdown ?? []).map((b) => ({ ...b, course_id: c.id, course_title: c.title })))
  return { rows, passed }
}

function SubmissionRow({ r }: { r: Row }) {
  const type = STEP_TYPES.find((t) => t.id === r.step_type) ?? resolveStepType('task', null, r.step_id)
  const st = r.sub ? subStatus[r.sub.status] : null
  // Автопроверка с 0 баллов — неверный ответ
  const wrongAuto = r.sub?.check_type === 'auto' && r.sub.score === 0
  return (
    <Link to={`/courses/${r.course_id}/steps/${r.step_id}`} className="flex gap-4 rounded-3xl p-4 transition-colors hover:bg-brand/5">
      <StepTypeIcon type={type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{r.step_title}</span>
          {st && <Badge color={wrongAuto ? '#EF4444' : st.color}>{wrongAuto ? 'Неверно' : st.label}</Badge>}
          {r.sub?.check_type === 'auto' && <Badge color="#3D5AFE">автопроверка</Badge>}
        </div>
        <div className="text-xs text-content-secondary">
          {r.course_title} · отправлено {formatDate(r.sub?.created_at ?? r.created_at)}
          {r.sub?.reviewed_at && ` · проверено ${formatDate(r.sub.reviewed_at)}`}
        </div>
        {r.sub?.feedback && r.sub.check_type === 'manual' && (
          <div className="mt-2 rounded-2xl bg-brand/6 px-4 py-2.5 text-sm whitespace-pre-wrap">💬 {r.sub.feedback}</div>
        )}
        {!r.sub && <div className="mt-1 text-xs text-content-secondary">Статус недоступен</div>}
      </div>
      {r.sub?.score !== null && r.sub?.score !== undefined && <ScorePill className="self-start">{formatScore(r.sub.score)}</ScorePill>}
    </Link>
  )
}

export function HistoryPage() {
  const user = useUser()
  const { data, error, loading, reload } = useAsync(() => load(user.id), [user.id])
  const [filter, setFilter] = useState<Filter>('all')

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data) return null

  const rows = data.rows.filter((r) => filter === 'all' || r.sub?.status === filter)
  const counts = {
    pending: data.rows.filter((r) => r.sub?.status === 'pending').length,
    returned: data.rows.filter((r) => r.sub?.status === 'returned').length,
  }

  return (
    <>
      <PageHeader title="Мои работы" subtitle="История отправленных заданий, статусы проверки и комментарии куратора" />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-medium">Отправленные работы</h2>
            <Segmented<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Все' },
                { value: 'pending', label: `На проверке${counts.pending ? ` · ${counts.pending}` : ''}` },
                { value: 'returned', label: `Возвращено${counts.returned ? ` · ${counts.returned}` : ''}` },
                { value: 'graded', label: 'Проверено' },
              ]}
            />
          </div>
          {rows.length === 0 ? (
            <EmptyState icon="📝" title={data.rows.length ? 'Нет работ с таким статусом' : 'Вы ещё не отправляли работ'}>
              {!data.rows.length && 'Отправленные ответы и работы появятся здесь вместе с оценкой и комментарием.'}
            </EmptyState>
          ) : (
            <Card>
              <List>
                {rows.map((r) => (
                  <SubmissionRow key={r.submission_id} r={r} />
                ))}
              </List>
            </Card>
          )}
          <p className="mt-3 px-2 text-xs text-content-secondary">Список отправок хранится на этом устройстве; статусы и оценки загружаются с сервера.</p>
        </section>

        <aside>
          <h2 className="mb-4 text-xl font-medium">Засчитанные задания</h2>
          {data.passed.length === 0 ? (
            <EmptyState icon="🌱" title="Пока ничего не засчитано" />
          ) : (
            <Card>
              <List>
                {data.passed.map((b: BreakdownItem & { course_id: string; course_title: string }) => (
                  <Link key={b.step_id} to={`/courses/${b.course_id}/steps/${b.step_id}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-brand/5">
                    <StepTypeIcon type={resolveStepType(b.kind, null, b.step_id)} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{b.title}</span>
                      <span className="block truncate text-xs text-content-secondary">{b.course_title}</span>
                    </span>
                    <ScorePill>
                      {formatScore(b.score)}/{formatScore(b.max_score)}
                    </ScorePill>
                  </Link>
                ))}
              </List>
            </Card>
          )}
        </aside>
      </div>
    </>
  )
}
