import { Link, useParams } from 'react-router-dom'
import { courseApi, flattenOutline, sortOutline } from '@/entities/course'
import { useUser } from '@/entities/session'
import { useEnrollCourse } from '@/features/enroll-course'
import { OutlineTree } from '@/widgets/course-outline'
import { ApiError, type NextStep } from '@/shared/api'
import { formatPercent, plural, useAsync } from '@/shared/lib'
import { Button, ButtonLink, Card, ErrorBox, Loader, Notice, PageHeader, ProgressBar, ScorePill } from '@/shared/ui'

async function loadCourse(courseId: string) {
  const [outline, catalog] = await Promise.all([courseApi.outline(courseId), courseApi.catalog()])
  const course = catalog.items.find((c) => c.id === courseId)
  let next: NextStep | null = null
  if (course?.enrollment) {
    next = await courseApi.next(courseId).catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    })
  }
  return { outline: sortOutline(outline), course, next }
}

export function CoursePage() {
  const { courseId = '' } = useParams()
  const user = useUser()
  const { data, error, loading, reload } = useAsync(() => loadCourse(courseId), [courseId])
  const { enroll, busy: enrolling, error: enrollError } = useEnrollCourse(courseId, reload)

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data) return null

  const { outline, course, next } = data
  const enrolled = !!course?.enrollment
  const flat = flattenOutline(outline)
  const returned = flat.filter((s) => s.progress.status === 'returned')
  const submitted = flat.filter((s) => s.progress.status === 'submitted')
  const step = next?.current_step

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
