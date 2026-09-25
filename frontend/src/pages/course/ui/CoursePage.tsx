import { Link, useParams } from 'react-router-dom'
import { CoursePassportCard, courseApi, flattenOutline, sortOutline } from '@/entities/course'
import { useUser } from '@/entities/session'
import { resolveStepType } from '@/entities/step'
import { useEnrollCourse } from '@/features/enroll-course'
import { CourseMap, OutlineTree } from '@/widgets/course-outline'
import { ApiError, type NextStep } from '@/shared/api'
import { formatPercent, plural, useAsync } from '@/shared/lib'
import { Button, ButtonLink, Card, ErrorBox, Icon, Loader, Notice, PageHeader, ProgressBar, SectionLabel, StatusPill } from '@/shared/ui'

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
  const student = user.role === 'student'

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data) return null

  const { outline, course, next } = data
  const enrolled = !!course?.enrollment
  const flat = flattenOutline(outline)
  const returned = flat.filter((s) => s.progress.status === 'returned')
  const submitted = flat.filter((s) => s.progress.status === 'submitted')
  const current = next?.current_step ? flat.find((s) => s.id === next.current_step!.id) : undefined
  const passed = flat.filter((s) => s.progress.status === 'passed').length
  const percent = next?.percent ?? course?.enrollment?.percent ?? 0

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to={student ? '/learn' : '/catalog'} className="inline-flex items-center gap-1 hover:text-brand-blue">
            <Icon name="arrowLeft" size={16} />
            {student ? 'На главную' : 'Все курсы'}
          </Link>
        }
        title={outline.course.title}
        subtitle={outline.course.description}
      />

      {enrolled && flat.length > 0 && (
        <Card className="mb-6 p-5">
          <SectionLabel>Карта курса · где я и что дальше</SectionLabel>
          <CourseMap steps={flat} currentId={current?.id} courseId={courseId} />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="order-2 lg:order-1">
          <OutlineTree outline={outline} enrolled={enrolled} currentId={current?.id} />
        </div>

        <aside className="order-1 space-y-4 lg:order-2">
          {enrolled && course ? (
            <>
              <Card className="p-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold">Прогресс</span>
                  <span className="num text-brand-ink-2">
                    {passed} из {flat.length}
                  </span>
                </div>
                <ProgressBar value={percent} className="mt-3" />
                <div className="mt-2 text-sm text-brand-ink-3">
                  <span className="num">{formatPercent(percent)}</span> обязательных шагов пройдено
                </div>

                <div className="mt-5 border-t border-brand-line pt-5">
                  <div className="eyebrow text-brand-ink-3">Следующий шаг</div>
                  {current ? (
                    <>
                      <div className="mt-1 text-lg font-bold">{current.title}</div>
                      <div className="text-sm text-brand-ink-2">
                        {resolveStepType(current.kind, current.type).label} · шаг {current.index} из {flat.length}
                      </div>
                      <ButtonLink to={`/courses/${courseId}/steps/${current.id}`} className="mt-4 w-full">
                        Продолжить
                        <Icon name="arrowRight" size={18} />
                      </ButtonLink>
                    </>
                  ) : (
                    <div className="mt-2">
                      <StatusPill tone={submitted.length ? 'review' : 'done'} label={submitted.length ? 'Всё сдано, ждём проверку куратора' : 'Курс пройден'} />
                    </div>
                  )}
                </div>
                <ButtonLink to={`/courses/${courseId}/progress`} variant="secondary" className="mt-3 w-full">
                  Из чего сложились баллы
                </ButtonLink>
              </Card>

              {returned.length > 0 && (
                <div className="rounded-card border border-brand-amber/30 bg-brand-amber-50 p-5 text-brand-night">
                  <StatusPill tone="returned" />
                  <p className="mt-2 text-sm">Куратор оставил комментарий — поправь и отправь снова.</p>
                  <div className="mt-2 space-y-1">
                    {returned.map((s) => (
                      <Link key={s.id} to={`/courses/${courseId}/steps/${s.id}`} className="block font-semibold text-brand-amber-text hover:underline">
                        {s.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {submitted.length > 0 && (
                <Notice tone="review">
                  <StatusPill tone="review" />
                  <p className="mt-2">
                    <span className="num">{submitted.length}</span> {plural(submitted.length, 'работа ждёт', 'работы ждут', 'работ ждут')} куратора. Результат появится на шаге, а пока можно идти дальше.
                  </p>
                </Notice>
              )}
            </>
          ) : student ? (
            <Card className="p-5">
              <div className="text-lg font-bold">Начни этот курс</div>
              <p className="mt-1 text-sm text-brand-ink-2">
                <span className="num">{flat.length}</span> {plural(flat.length, 'шаг', 'шага', 'шагов')}. Прогресс и баллы видны сразу после первого шага.
              </p>
              {enrollError && (
                <div className="mt-3">
                  <ErrorBox error={enrollError} />
                </div>
              )}
              <Button onClick={enroll} loading={enrolling} className="mt-4 w-full">
                Начать курс
              </Button>
            </Card>
          ) : (
            <Notice>Вы смотрите программу курса. Проходить шаги могут ученики.</Notice>
          )}
          <CoursePassportCard passport={outline.course.passport} />
        </aside>
      </div>
    </>
  )
}
