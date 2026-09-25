import { Link, useParams } from 'react-router-dom'
import { courseApi, flattenOutline, sortOutline } from '@/entities/course'
import { StepTypeIcon, resolveStepType } from '@/entities/step'
import { RatingBreakdown } from '@/widgets/rating-breakdown'
import { ApiError, type BreakdownItem } from '@/shared/api'
import { formatDate, formatPercent, formatScore, useAsync } from '@/shared/lib'
import { ButtonLink, Card, EmptyState, ErrorBox, Icon, Loader, PageHeader, ProgressBar, SectionLabel, StatusPill } from '@/shared/ui'

const sourceLabel: Record<BreakdownItem['source'], string> = {
  auto: 'Задания с автопроверкой',
  manual: 'Работы, принятые куратором',
  theory: 'Теория',
}

async function load(courseId: string) {
  const [progress, outline] = await Promise.all([courseApi.progress(courseId), courseApi.outline(courseId)])
  return { progress, outline: sortOutline(outline) }
}

export function ProgressPage() {
  const { courseId = '' } = useParams()
  const { data, error, loading, reload } = useAsync(() => load(courseId), [courseId])

  if (loading && !data) return <Loader />
  if (error instanceof ApiError && error.status === 404) {
    return (
      <EmptyState icon="chart" title="Прогресс появится после начала курса">
        <Link to={`/courses/${courseId}`} className="font-semibold text-brand-blue">
          Открыть программу курса
        </Link>
      </EmptyState>
    )
  }
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data) return null

  const { progress: p, outline } = data
  const r = p.rating
  const flat = flattenOutline(outline)
  const lostPoints = r.breakdown.filter((b) => b.score < b.max_score)
  const bySource = (['auto', 'manual', 'theory'] as const).map((src) => ({ src, items: r.breakdown.filter((b) => b.source === src) })).filter((g) => g.items.length)
  const currentStep = flat.find((s) => s.id === p.current_step_id)

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-1 hover:text-brand-blue">
            <Icon name="arrowLeft" size={16} />
            {outline.course.title}
          </Link>
        }
        title="Прогресс и баллы"
        subtitle={`Обновлено ${formatDate(p.updated_at)}`}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <RatingBreakdown progress={p} steps={flat} />

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">Курс пройден</span>
              <span className="num text-2xl font-extrabold">{formatPercent(p.percent)}</span>
            </div>
            <ProgressBar value={p.percent} className="mt-3" />
            <p className="mt-2 text-sm text-brand-ink-2">
              Зачтено <span className="num font-semibold text-brand-ink">{p.completed_required_steps}</span> из <span className="num font-semibold text-brand-ink">{p.total_required_steps}</span> обязательных шагов. Теория тоже считается.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">Рейтинг в курсе</span>
              <span className="num text-2xl font-extrabold">
                {formatScore(r.score)}
                <span className="text-base font-semibold text-brand-ink-3"> из 100</span>
              </span>
            </div>
            <p className="mt-2 text-sm text-brand-ink-2">
              Сколько процентов всех баллов курса уже получено:{' '}
              <span className="num rounded-md bg-brand-mist px-1.5 py-0.5 font-mono whitespace-nowrap text-brand-ink">
                {formatScore(r.total_score)} ÷ {formatScore(r.total_max)} × 100
              </span>
              . Баллы от куратора и от автопроверки считаются одинаково.
            </p>
          </Card>

          <Card className="p-6">
            <div className="eyebrow text-brand-ink-3">Что делать дальше</div>
            {currentStep ? (
              <>
                <div className="mt-1 text-lg font-bold">{currentStep.title}</div>
                <div className="text-sm text-brand-ink-2">
                  {currentStep.module.title} · {currentStep.lesson.title}
                </div>
                <ButtonLink to={`/courses/${courseId}/steps/${currentStep.id}`} className="mt-4 w-full">
                  Продолжить
                  <Icon name="arrowRight" size={18} />
                </ButtonLink>
              </>
            ) : (
              <div className="mt-2">
                <StatusPill tone="done" label="Все шаги пройдены" />
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <SectionLabel>Из чего сложились баллы</SectionLabel>
          {r.breakdown.length === 0 ? (
            <EmptyState icon="sparkle" title="Баллов пока нет">
              Выполни первое задание — и здесь появится разбор.
            </EmptyState>
          ) : (
            <Card>
              {bySource.map(({ src, items }) => (
                <div key={src} className="border-b border-brand-line p-2 last:border-0">
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-bold">
                    <span>{sourceLabel[src]}</span>
                    <span className="num">
                      {formatScore(items.reduce((a, b) => a + b.score, 0))} из {formatScore(items.reduce((a, b) => a + b.max_score, 0))}
                    </span>
                  </div>
                  <ul>
                    {items.map((b) => (
                      <li key={b.step_id}>
                        <Link to={`/courses/${courseId}/steps/${b.step_id}`} className="flex items-center gap-3 rounded-btn px-3 py-2 hover:bg-brand-mist">
                          <StepTypeIcon type={resolveStepType(b.kind, null, b.step_id)} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{b.title}</span>
                            <span className="text-xs text-brand-ink-3">{b.source === 'manual' ? 'проверил куратор' : 'проверено автоматически'}</span>
                          </span>
                          <span className="num font-bold">
                            {formatScore(b.score)}
                            <span className="font-normal text-brand-ink-3">/{formatScore(b.max_score)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          )}
        </section>

        {lostPoints.length > 0 && (
          <section>
            <SectionLabel>Где баллов могло быть больше</SectionLabel>
            <Card className="p-2">
              <ul>
                {lostPoints.map((b) => (
                  <li key={b.step_id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="truncate">{b.title}</span>
                    <span className="num shrink-0 font-semibold text-brand-ink-2">
                      {formatScore(b.score)} из {formatScore(b.max_score)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
      </div>
    </>
  )
}
