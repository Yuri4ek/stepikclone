import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, type NextStep, type Outline, type OutlineStep } from '../../api'
import { useUser } from '../../auth/AuthContext'
import { formatPercent, formatScore, plural } from '../../lib/format'
import { flattenOutline, lessonStats, sortOutline } from '../../lib/outline'
import { useAsync } from '../../lib/useAsync'
import { resolveStepType } from '../../steps/registry'
import { StepTypeIcon } from '../../components/StepTypeBadge'
import { Button, ButtonLink, Card, ErrorBox, Loader, Notice, PageHeader, ProgressBar, ScorePill, StatusBadge, cx } from '../../components/ui'

async function loadCourse(courseId: string) {
  const [outline, catalog] = await Promise.all([api.catalog.outline(courseId), api.catalog.courses()])
  const course = catalog.items.find((c) => c.id === courseId)
  let next: NextStep | null = null
  if (course?.enrollment) {
    next = await api.catalog.next(courseId).catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    })
  }
  return { outline: sortOutline(outline), course, next }
}

export function StepRow({ step, courseId, enrolled, current }: { step: OutlineStep; courseId: string; enrolled: boolean; current?: boolean }) {
  const type = resolveStepType(step.kind, null, step.id)
  const locked = !enrolled || step.progress.status === 'locked'
  const inner = (
    <>
      <StepTypeIcon type={type} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{step.title}</span>
        <span className="text-xs text-content-secondary">
          {type.label}
          {step.max_score > 0 && ` · до ${formatScore(step.max_score)} баллов`}
          {!step.is_required && ' · необязательный'}
        </span>
      </span>
      {step.progress.score !== null && step.max_score > 0 && (
        <ScorePill>
          {formatScore(step.progress.score)}/{formatScore(step.max_score)}
        </ScorePill>
      )}
      {enrolled && <StatusBadge status={step.progress.status} />}
    </>
  )
  const cls = cx('flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors', current && 'bg-brand/10')
  return locked ? (
    <div className={cx(cls, 'opacity-60')}>{inner}</div>
  ) : (
    <Link to={`/courses/${courseId}/steps/${step.id}`} className={cx(cls, 'hover:bg-brand/5')}>
      {inner}
    </Link>
  )
}

function OutlineTree({ outline, enrolled, currentId }: { outline: Outline; enrolled: boolean; currentId?: string }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  return (
    <div className="space-y-4">
      {outline.modules.map((m, mi) => (
        <Card key={m.id}>
          <div className="px-6 pt-6 pb-2">
            <div className="text-sm text-brand-violet">Модуль {mi + 1}</div>
            <h2 className="text-xl font-medium">{m.title}</h2>
          </div>
          <div className="space-y-1 p-2">
            {m.lessons.map((l, li) => {
              const st = lessonStats(l)
              const open = !collapsed[l.id]
              return (
                <div key={l.id}>
                  <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-brand/5" onClick={() => setCollapsed({ ...collapsed, [l.id]: open })} aria-expanded={open}>
                    <span className={cx('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium', st.done ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' : 'bg-brand/10 text-brand')}>
                      {st.done ? '✓' : `${mi + 1}.${li + 1}`}
                    </span>
                    <span className="flex-1 font-medium">{l.title}</span>
                    {enrolled && (
                      <span className="text-xs text-content-secondary">
                        {st.passed}/{st.total}
                      </span>
                    )}
                    <span className={cx('text-content-secondary transition-transform', open && 'rotate-90')}>›</span>
                  </button>
                  {open && (
                    <div className="space-y-0.5 px-1 pb-2">
                      {l.steps.map((s) => (
                        <StepRow key={s.id} step={s} courseId={outline.course.id} enrolled={enrolled} current={s.id === currentId} />
                      ))}
                      {l.steps.length === 0 && <div className="px-3 py-2 text-sm text-content-secondary">В уроке пока нет шагов</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}

export function CoursePage() {
  const { courseId = '' } = useParams()
  const user = useUser()
  const { data, error, loading, reload } = useAsync(() => loadCourse(courseId), [courseId])
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<Error>()

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data) return null

  const { outline, course, next } = data
  const enrolled = !!course?.enrollment
  const flat = flattenOutline(outline)
  const returned = flat.filter((s) => s.progress.status === 'returned')
  const submitted = flat.filter((s) => s.progress.status === 'submitted')
  const step = next?.current_step

  const enroll = async () => {
    setEnrolling(true)
    setEnrollError(undefined)
    try {
      await api.catalog.enroll(courseId)
      await reload()
    } catch (e) {
      setEnrollError(e as Error)
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to={user.role === 'student' ? '/learn' : '/catalog'} className="hover:text-brand-hover">
            ← {user.role === 'student' ? 'Моё обучение' : 'Каталог'}
          </Link>
        }
        title={outline.course.title}
        subtitle={course?.description}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="order-2 lg:order-1">
          <OutlineTree outline={outline} enrolled={enrolled} currentId={step?.id} />
        </div>

        <aside className="order-1 space-y-4 lg:order-2">
          {enrolled && course ? (
            <>
              <Card className="p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-content-secondary">Прогресс</div>
                    <div className="text-3xl font-medium">{formatPercent(next?.percent ?? course.enrollment!.percent)}</div>
                  </div>
                  <ScorePill className="text-sm">{Math.round(course.enrollment!.rating_score)} рейтинг</ScorePill>
                </div>
                <ProgressBar value={next?.percent ?? course.enrollment!.percent} className="mt-3" />
                <div className="mt-5 rounded-3xl bg-brand/8 p-5">
                  <div className="text-sm text-content-secondary">Следующий шаг</div>
                  {step ? (
                    <>
                      <div className="mt-1 font-medium">{step.title}</div>
                      <div className="text-sm text-content-secondary">{step.action_hint}</div>
                      <ButtonLink to={`/courses/${courseId}/steps/${step.id}`} className="mt-3 w-full">
                        Перейти к шагу →
                      </ButtonLink>
                    </>
                  ) : (
                    <div className="mt-1 font-medium text-status-success">🏆 {next?.message ?? 'Курс пройден'}</div>
                  )}
                </div>
                <ButtonLink to={`/courses/${courseId}/progress`} variant="secondary" className="mt-3 w-full">
                  Из чего сложился рейтинг
                </ButtonLink>
              </Card>

              {returned.length > 0 && (
                <Card className="p-5" accent="#EF4444">
                  <div className="font-medium">↩ Возвращено на доработку</div>
                  <p className="mt-1 text-sm text-content-secondary">Куратор оставил комментарий — исправьте и отправьте снова.</p>
                  <div className="mt-2 space-y-1">
                    {returned.map((s) => (
                      <Link key={s.id} to={`/courses/${courseId}/steps/${s.id}`} className="block text-sm font-medium text-brand-hover hover:underline">
                        {s.title}
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
              {submitted.length > 0 && (
                <Card className="p-5" accent="#F59E0B">
                  <div className="font-medium">⏳ На проверке у куратора</div>
                  <p className="mt-1 text-sm text-content-secondary">
                    {submitted.length} {plural(submitted.length, 'работа', 'работы', 'работ')}. Пока идёт проверка, можно проходить следующие шаги.
                  </p>
                </Card>
              )}
            </>
          ) : user.role === 'student' ? (
            <Card className="p-5">
              <div className="font-medium">Запишитесь, чтобы начать</div>
              <p className="mt-1 text-sm text-content-secondary">
                {flat.length} {plural(flat.length, 'шаг', 'шага', 'шагов')} · прогресс и рейтинг будут видны сразу
              </p>
              {enrollError && <div className="mt-3"><ErrorBox error={enrollError} /></div>}
              <Button onClick={enroll} loading={enrolling} className="mt-4 w-full">
                Записаться на курс
              </Button>
            </Card>
          ) : (
            <Notice>Вы смотрите программу курса. Прохождение шагов доступно ученикам.</Notice>
          )}
        </aside>
      </div>
    </>
  )
}
