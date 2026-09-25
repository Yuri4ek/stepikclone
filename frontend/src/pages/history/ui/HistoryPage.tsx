import { useState } from 'react'
import { Link } from 'react-router-dom'
import { courseApi } from '@/entities/course'
import { useUser } from '@/entities/session'
import { STEP_TYPES, StepTypeIcon, resolveStepType } from '@/entities/step'
import { readLog, submissionApi, submissionTone, type LoggedSubmission } from '@/entities/submission'
import type { BreakdownItem, Submission } from '@/shared/api'
import { formatDate, formatScore, useAsync } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Icon, List, Loader, PageHeader, ScorePill, SectionLabel, Segmented, StatusPill } from '@/shared/ui'

type Row = LoggedSubmission & { sub: Submission | null }
type Filter = 'all' | 'pending' | 'returned' | 'graded'

async function load(userId: string) {
  const log = readLog(userId).slice(0, 60)
  const subs = await Promise.all(log.map((e) => submissionApi.get(e.submission_id).catch(() => null)))
  const rows: Row[] = log.map((e, i) => ({ ...e, sub: subs[i] }))

  // Зачтённые задания — с сервера, по всем курсам ученика (видны с любого устройства)
  const catalog = await courseApi.catalog()
  const mine = catalog.items.filter((c) => c.enrollment)
  const progress = await Promise.all(mine.map((c) => courseApi.progress(c.id).catch(() => null)))
  const passed = mine.flatMap((c, i) => (progress[i]?.rating.breakdown ?? []).map((b) => ({ ...b, course_id: c.id, course_title: c.title })))
  return { rows, passed }
}

function SubmissionRow({ r }: { r: Row }) {
  const type = STEP_TYPES.find((t) => t.id === r.step_type) ?? resolveStepType('task', null, r.step_id)
  return (
    <Link to={`/courses/${r.course_id}/steps/${r.step_id}`} className="flex gap-4 rounded-btn p-4 transition-colors hover:bg-brand-mist">
      <StepTypeIcon type={type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{r.step_title}</span>
          {r.sub && <StatusPill tone={submissionTone(r.sub)} checkedBy={r.sub.status === 'graded' ? r.sub.check_type : null} />}
        </div>
        <div className="mt-0.5 text-sm text-brand-ink-3">
          {r.course_title} · отправлено {formatDate(r.sub?.created_at ?? r.created_at)}
          {r.sub?.reviewed_at && r.sub.check_type === 'manual' && ` · проверено ${formatDate(r.sub.reviewed_at)}`}
        </div>
        {r.sub?.feedback && r.sub.check_type === 'manual' && (
          <div className="mt-2 flex gap-2 rounded-field bg-brand-mist px-4 py-2.5 whitespace-pre-wrap">
            <Icon name="message" size={18} className="mt-0.5 shrink-0 text-brand-ink-3" />
            {r.sub.feedback}
          </div>
        )}
        {!r.sub && <div className="mt-1 text-sm text-brand-ink-3">Статус сейчас недоступен</div>}
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
      <PageHeader title="Мои работы" subtitle="Отправленные ответы, результаты проверки и комментарии куратора" />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionLabel className="mb-0">Отправленные работы</SectionLabel>
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
            <EmptyState icon="inbox" title={data.rows.length ? 'Работ с таким статусом нет' : 'Здесь пока пусто'}>
              {!data.rows.length && 'Отправленные ответы появятся здесь вместе с оценкой и комментарием.'}
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
          <p className="mt-3 px-1 text-sm text-brand-ink-3">Список отправок хранится на этом устройстве, статусы и оценки приходят с сервера.</p>
        </section>

        <aside>
          <SectionLabel>Зачтённые задания</SectionLabel>
          {data.passed.length === 0 ? (
            <EmptyState icon="sparkle" title="Пока ничего не зачтено" />
          ) : (
            <Card>
              <List>
                {data.passed.map((b: BreakdownItem & { course_id: string; course_title: string }) => (
                  <Link key={b.step_id} to={`/courses/${b.course_id}/steps/${b.step_id}`} className="flex items-center gap-3 rounded-btn px-3 py-2.5 hover:bg-brand-mist">
                    <StepTypeIcon type={resolveStepType(b.kind, null, b.step_id)} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{b.title}</span>
                      <span className="block truncate text-sm text-brand-ink-3">{b.source === 'manual' ? 'проверил куратор' : 'проверено автоматически'}</span>
                    </span>
                    <span className="num font-bold">
                      {formatScore(b.score)}
                      <span className="font-normal text-brand-ink-3">/{formatScore(b.max_score)}</span>
                    </span>
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
