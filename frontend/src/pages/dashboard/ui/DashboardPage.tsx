import { courseApi, courseCoverStyle } from '@/entities/course'
import { useUser } from '@/entities/session'
import { StepTypeBadge, resolveStepType } from '@/entities/step'
import { CatalogCourseCard } from '@/widgets/course-card'
import type { CatalogCourse, NextStep } from '@/shared/api'
import { formatPercent, useAsync } from '@/shared/lib'
import { ButtonLink, Card, EmptyState, ErrorBox, Loader, ProgressBar, ScorePill } from '@/shared/ui'

interface MyCourse {
  course: CatalogCourse
  next: NextStep | null
}

async function loadDashboard() {
  const catalog = await courseApi.catalog()
  const mine = catalog.items.filter((c) => c.enrollment)
  const nexts = await Promise.all(mine.map((c) => courseApi.next(c.id).catch(() => null)))
  return {
    mine: mine.map<MyCourse>((course, i) => ({ course, next: nexts[i] })),
    others: catalog.items.filter((c) => !c.enrollment),
  }
}

function ContinueCard({ course, next }: MyCourse) {
  const e = course.enrollment!
  const step = next?.current_step
  const type = step ? resolveStepType(step.kind, null, step.id) : null
  const done = next && !step
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="relative m-2 shrink-0 overflow-hidden rounded-[22px] p-6 text-white sm:w-60" style={courseCoverStyle(course)}>
          <div className="absolute -right-10 -bottom-10 size-40 rounded-full bg-white/20 blur-2xl" aria-hidden />
          <div className="text-sm opacity-80">Курс</div>
          <div className="mt-1 text-lg leading-snug font-medium">{course.title}</div>
          <div className="mt-4 text-3xl font-medium">{formatPercent(next?.percent ?? e.percent)}</div>
          <div className="text-xs opacity-80">курса пройдено</div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <ProgressBar value={next?.percent ?? e.percent} className="flex-1" />
            <ScorePill>{Math.round(e.rating_score)} баллов рейтинга</ScorePill>
          </div>
          {done ? (
            <div className="flex-1">
              <div className="text-lg font-medium text-status-success">🏆 {next.message}</div>
              <p className="text-sm text-content-secondary">Посмотрите, из чего сложился ваш рейтинг.</p>
            </div>
          ) : step && type ? (
            <div className="flex-1">
              <div className="text-sm text-content-secondary">Что делать дальше</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-lg font-medium">{step.title}</span>
                <StepTypeBadge type={type} />
              </div>
              <p className="mt-1 text-sm text-content-secondary">{step.action_hint}</p>
            </div>
          ) : (
            <div className="flex-1 text-sm text-content-secondary">{next?.message ?? 'Откройте курс, чтобы продолжить'}</div>
          )}
          <div className="flex flex-wrap gap-2">
            {step ? (
              <ButtonLink to={`/courses/${course.id}/steps/${step.id}`}>Продолжить →</ButtonLink>
            ) : (
              <ButtonLink to={`/courses/${course.id}`}>Открыть курс</ButtonLink>
            )}
            <ButtonLink to={`/courses/${course.id}/progress`} variant="secondary">
              Мой рейтинг
            </ButtonLink>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const user = useUser()
  const { data, error, loading, reload } = useAsync(loadDashboard, [])
  const firstName = user.full_name.split(' ')[0]

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Привет, <span className="text-brand-gradient">{firstName}</span>! 👋</h1>
        <p className="mt-1 text-content-secondary">Здесь всегда видно, где вы в курсе и какой шаг следующий.</p>
      </section>

      {loading && !data && <Loader />}
      {error && <ErrorBox error={error} onRetry={reload} />}

      {data && (
        <>
          <section className="space-y-4">
            <h2 className="text-xl font-medium">Мои курсы</h2>
            {data.mine.length === 0 ? (
              <EmptyState icon="🚀" title="Вы пока не записаны ни на один курс">
                Выберите курс ниже — и начинайте с первого шага.
              </EmptyState>
            ) : (
              data.mine.map((m) => <ContinueCard key={m.course.id} {...m} />)
            )}
          </section>

          {data.others.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-medium">Доступные курсы</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.others.map((c) => (
                  <CatalogCourseCard key={c.id} course={c} onEnrolled={reload} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
