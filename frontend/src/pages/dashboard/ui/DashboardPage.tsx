import { Link } from 'react-router-dom'
import { courseApi, flattenOutline, sortOutline, type FlatStep } from '@/entities/course'
import { useUser } from '@/entities/session'
import { stepApi } from '@/entities/step'
import { CatalogCourseCard } from '@/widgets/course-card'
import { NextStepCard } from '@/widgets/next-step'
import type { CatalogCourse, CourseProgress } from '@/shared/api'
import { formatPercent, plural, useAsync } from '@/shared/lib'
import { EmptyState, ErrorBox, Icon, Loader, ProgressBar, SectionLabel, StatusPill } from '@/shared/ui'

interface MyCourse {
  course: CatalogCourse
  steps: FlatStep[]
  current: FlatStep | null
  returned: { step: FlatStep; feedback: string | null }[]
  progress: CourseProgress | null
}

async function loadMyCourse(course: CatalogCourse): Promise<MyCourse> {
  const [outline, next, progress] = await Promise.all([courseApi.outline(course.id), courseApi.next(course.id).catch(() => null), courseApi.progress(course.id).catch(() => null)])
  const steps = flattenOutline(sortOutline(outline))
  // Текущий шаг берём у бэкенда (/next), номер и статус — из оглавления
  const current = next?.current_step ? (steps.find((s) => s.id === next.current_step!.id) ?? null) : null
  const returnedSteps = steps.filter((s) => s.progress.status === 'returned').slice(0, 3)
  const feedback = await Promise.all(returnedSteps.map((s) => stepApi.get(s.id).then((d) => d.progress.feedback).catch(() => null)))
  return { course, steps, current, progress, returned: returnedSteps.map((step, i) => ({ step, feedback: feedback[i] })) }
}

async function loadDashboard() {
  const catalog = await courseApi.catalog()
  const mineRaw = catalog.items.filter((c) => c.enrollment)
  const mine = await Promise.all(mineRaw.map(loadMyCourse))
  return { mine, others: catalog.items.filter((c) => !c.enrollment) }
}

const waitingCount = (m: MyCourse) => m.steps.filter((s) => s.progress.status === 'submitted').length

function CourseProgressRow({ m }: { m: MyCourse }) {
  const passed = m.steps.filter((s) => s.progress.status === 'passed').length
  return (
    <Link to={`/courses/${m.course.id}`} className="block rounded-card border border-brand-line bg-white p-5 transition-colors hover:border-brand-blue-200">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold">{m.course.title}</span>
        <span className="num shrink-0 text-brand-ink-2">
          {passed} из {m.steps.length}
        </span>
      </div>
      <ProgressBar value={m.course.enrollment!.percent} className="mt-3" />
      <div className="mt-2 flex justify-between gap-3 text-sm text-brand-ink-3">
        <span className="truncate">{m.current ? `Дальше: ${m.current.title}` : waitingCount(m) ? 'Всё сдано, ждём проверку' : 'Курс пройден'}</span>
        <span className="num shrink-0">{formatPercent(m.course.enrollment!.percent)}</span>
      </div>
      {m.progress?.rating.place && m.progress.rating.group_size > 1 && (
        <div className="num mt-1 text-sm text-brand-ink-2">
          {m.progress.rating.place}-е место из {m.progress.rating.group_size} в группе курса
        </div>
      )}
    </Link>
  )
}

export function DashboardPage() {
  const user = useUser()
  const { data, error, loading, reload } = useAsync(loadDashboard, [])
  const firstName = user.full_name.split(' ')[0]

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data) return null

  // Главный курс — первый незавершённый; если все пройдены — первый
  const main = data.mine.find((m) => m.current) ?? data.mine[0]
  const returned = data.mine.flatMap((m) => m.returned.map((r) => ({ ...r, course: m.course })))
  const streak = data.mine.reduce((a, m) => Math.max(a, m.progress?.streak_days ?? 0), 0)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[36px] leading-tight font-extrabold tracking-tight">Привет, {firstName}!</h1>
        <p className="mt-1 flex flex-wrap items-center gap-3 text-brand-ink-2">
          {main ? 'Вот что делать дальше.' : 'Выбери курс, и начнём с первого шага.'}
          {streak > 1 && (
            <span className="num inline-flex items-center gap-1.5 rounded-full bg-brand-blue-50 px-3 py-0.5 text-sm font-semibold text-brand-blue">
              <Icon name="flag" size={16} />
              {streak} {plural(streak, 'день', 'дня', 'дней')} подряд
            </span>
          )}
        </p>
      </div>

      {main ? (
        <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <NextStepCard courseId={main.course.id} courseTitle={main.course.title} step={main.current} total={main.steps.length} waiting={waitingCount(main)} />
          <div className="space-y-4">
            {returned.map((r) => (
              <Link key={r.step.id} to={`/courses/${r.course.id}/steps/${r.step.id}`} className="block rounded-card border border-brand-amber/30 bg-brand-amber-50 p-5 text-brand-night transition-colors hover:border-brand-amber">
                <StatusPill tone="returned" />
                <p className="mt-3">
                  <b>«{r.step.title}»</b>
                  {r.feedback ? `: «${r.feedback}»` : ' — куратор оставил комментарий на шаге.'}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-amber-text">
                  Поправить
                  <Icon name="arrowRight" size={16} />
                </span>
              </Link>
            ))}
            {data.mine.map((m) => (
              <CourseProgressRow key={m.course.id} m={m} />
            ))}
            <Link to="/history" className="flex items-center justify-between rounded-card border border-brand-line bg-white px-5 py-4 font-semibold transition-colors hover:border-brand-blue-200">
              Мои работы и оценки
              <Icon name="chevronRight" size={18} className="text-brand-ink-3" />
            </Link>
          </div>
        </div>
      ) : (
        <EmptyState icon="flag" title="У тебя пока нет курсов">
          Выбери курс ниже — прогресс и баллы появятся сразу после первого шага.
        </EmptyState>
      )}

      {data.others.length > 0 && (
        <section>
          <SectionLabel>Можно начать</SectionLabel>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.others.map((c) => (
              <CatalogCourseCard key={c.id} course={c} onEnrolled={reload} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
