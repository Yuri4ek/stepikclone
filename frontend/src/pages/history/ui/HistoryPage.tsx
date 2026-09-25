import { useState } from 'react'
import { Link } from 'react-router-dom'
import { courseApi } from '@/entities/course'
import { questionApi, QuestionThread } from '@/entities/question'
import { CheckReport, StepTypeIcon, STEP_TYPES, resolveStepType } from '@/entities/step'
import { submissionApi, submissionTone } from '@/entities/submission'
import type { BreakdownItem, SubmissionListItem, SubmissionStatus } from '@/shared/api'
import { formatDate, formatScore, useAsync } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Icon, List, Loader, PageHeader, Pager, ScorePill, SectionLabel, Segmented, StatusPill } from '@/shared/ui'

type Filter = 'all' | SubmissionStatus
const LIMIT = 30

async function loadSide() {
  // Зачтённые задания — по всем курсам ученика, из расшифровки рейтинга
  const catalog = await courseApi.catalog()
  const mine = catalog.items.filter((c) => c.enrollment)
  const [progress, questions] = await Promise.all([Promise.all(mine.map((c) => courseApi.progress(c.id).catch(() => null))), questionApi.mine()])
  const passed = mine.flatMap((c, i) => (progress[i]?.rating.breakdown ?? []).map((b) => ({ ...b, course_id: c.id, course_title: c.title })))
  return { passed, questions: questions.items }
}

function SubmissionRow({ r }: { r: SubmissionListItem }) {
  const type = STEP_TYPES.find((t) => t.id === r.step_type) ?? resolveStepType('task', r.step_type)
  const manual = r.check_type === 'manual'
  return (
    <Link to={`/courses/${r.course_id}/steps/${r.step_id}`} className="flex gap-4 rounded-btn p-4 transition-colors hover:bg-brand-mist">
      <StepTypeIcon type={type} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{r.step_title}</span>
          <StatusPill tone={submissionTone(r)} checkedBy={r.status === 'graded' && r.score !== 0 ? r.check_type : null} />
        </div>
        <div className="mt-0.5 text-sm text-brand-ink-3">
          {r.course_title} · отправлено {formatDate(r.created_at)}
          {r.reviewed_at && manual && ` · проверено ${formatDate(r.reviewed_at)}`}
        </div>
        {r.result && (
          <div className="mt-2">
            <CheckReport result={r.result} compact />
          </div>
        )}
        {r.feedback && manual && (
          <div className="mt-2 flex gap-2 rounded-field bg-brand-mist px-4 py-2.5 whitespace-pre-wrap">
            <Icon name="message" size={18} className="mt-0.5 shrink-0 text-brand-ink-3" />
            {r.feedback}
          </div>
        )}
      </div>
      {r.score !== null && r.max_score > 0 && (
        <ScorePill className="self-start">
          {formatScore(r.score)}/{formatScore(r.max_score)}
        </ScorePill>
      )}
    </Link>
  )
}

export function HistoryPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [offset, setOffset] = useState(0)
  const subs = useAsync(() => submissionApi.mine({ status: filter === 'all' ? undefined : filter, limit: LIMIT, offset }), [filter, offset])
  const side = useAsync(loadSide, [])

  return (
    <>
      <PageHeader title="Мои работы" subtitle="Все ответы и работы, результаты проверки и комментарии куратора — с любого устройства" />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionLabel className="mb-0">Отправленные работы</SectionLabel>
            <Segmented<Filter>
              value={filter}
              onChange={(f) => {
                setFilter(f)
                setOffset(0)
              }}
              options={[
                { value: 'all', label: 'Все' },
                { value: 'pending', label: 'На проверке' },
                { value: 'returned', label: 'Возвращено' },
                { value: 'graded', label: 'Проверено' },
              ]}
            />
          </div>
          {subs.error && <ErrorBox error={subs.error} onRetry={subs.reload} />}
          {subs.loading && !subs.data && <Loader />}
          {subs.data &&
            (subs.data.items.length === 0 ? (
              <EmptyState icon="inbox" title={filter === 'all' ? 'Здесь пока пусто' : 'Работ с таким статусом нет'}>
                {filter === 'all' && 'Отправленные ответы появятся здесь вместе с оценкой и комментарием.'}
              </EmptyState>
            ) : (
              <>
                <Card>
                  <List>
                    {subs.data.items.map((r) => (
                      <SubmissionRow key={r.id} r={r} />
                    ))}
                  </List>
                </Card>
                <Pager total={subs.data.total} limit={LIMIT} offset={offset} onChange={setOffset} />
              </>
            ))}
        </section>

        <aside className="space-y-8">
          <div>
            <SectionLabel>Зачтённые задания</SectionLabel>
            {side.data && side.data.passed.length === 0 && <EmptyState icon="sparkle" title="Пока ничего не зачтено" />}
            {side.data && side.data.passed.length > 0 && (
              <Card>
                <List>
                  {side.data.passed.map((b: BreakdownItem & { course_id: string; course_title: string }) => (
                    <Link key={b.step_id} to={`/courses/${b.course_id}/steps/${b.step_id}`} className="flex items-center gap-3 rounded-btn px-3 py-2.5 hover:bg-brand-mist">
                      <StepTypeIcon type={resolveStepType(b.kind, b.type)} size="sm" />
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
          </div>

          {side.data && side.data.questions.length > 0 && (
            <div>
              <SectionLabel>Мои вопросы куратору</SectionLabel>
              <Card className="divide-y divide-brand-line">
                {side.data.questions.map((q) => (
                  <div key={q.id} className="p-4">
                    <QuestionThread
                      q={q}
                      meta={
                        <Link to={`/courses/${q.course_id}/steps/${q.step_id}`} className="font-semibold text-brand-blue hover:underline">
                          {q.step_title}
                        </Link>
                      }
                    />
                  </div>
                ))}
              </Card>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
