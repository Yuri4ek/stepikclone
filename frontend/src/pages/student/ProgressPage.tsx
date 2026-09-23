import { Link, useParams } from 'react-router-dom'
import { api, type BreakdownItem } from '../../api'
import { formatDate, formatPercent, formatScore } from '../../lib/format'
import { flattenOutline, sortOutline } from '../../lib/outline'
import { useAsync } from '../../lib/useAsync'
import { resolveStepType } from '../../steps/registry'
import { StepTypeIcon } from '../../components/StepTypeBadge'
import { Badge, ButtonLink, Card, EmptyState, ErrorBox, Loader, PageHeader, ProgressBar, ScorePill } from '../../components/ui'

const sourceMeta: Record<BreakdownItem['source'], { label: string; color: string }> = {
  auto: { label: 'Автопроверка', color: '#2563EB' },
  manual: { label: 'Оценка куратора', color: '#0D9488' },
  theory: { label: 'Теория', color: '#8B5CF6' },
}

async function load(courseId: string) {
  const [progress, outline] = await Promise.all([api.progress.course(courseId), api.catalog.outline(courseId)])
  return { progress, outline: sortOutline(outline) }
}

export function ProgressPage() {
  const { courseId = '' } = useParams()
  const { data, error, loading, reload } = useAsync(() => load(courseId), [courseId])

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data) return null

  const { progress: p, outline } = data
  const r = p.rating
  const flat = flattenOutline(outline)
  const earned = new Set(r.breakdown.map((b) => b.step_id))
  const toEarn = flat.filter((s) => s.max_score > 0 && !earned.has(s.id))
  const lostPoints = r.breakdown.filter((b) => b.score < b.max_score)
  const bySource = (['auto', 'manual', 'theory'] as const)
    .map((src) => ({ src, items: r.breakdown.filter((b) => b.source === src) }))
    .filter((g) => g.items.length)
  const currentStep = flat.find((s) => s.id === p.current_step_id)

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to={`/courses/${courseId}`} className="hover:text-brand-hover">
            ← {outline.course.title}
          </Link>
        }
        title="Мой прогресс и рейтинг"
        subtitle={`Обновлено ${formatDate(p.updated_at)}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6" accent="#3D5AFE">
          <div className="text-sm text-content-secondary">Курс пройден</div>
          <div className="mt-1 text-4xl font-medium">{formatPercent(p.percent)}</div>
          <ProgressBar value={p.percent} className="mt-3" />
          <div className="mt-2 text-sm text-content-secondary">
            Обязательных шагов: {p.completed_required_steps} из {p.total_required_steps}
          </div>
        </Card>
        <Card className="p-6" accent="#F59E0B">
          <div className="text-sm text-amber-800">Рейтинг</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-medium text-amber-500">★ {formatScore(r.score)}</span>
            <span className="text-content-secondary">из 100</span>
          </div>
          <div className="mt-3 text-sm text-content-secondary">
            Набрано <b className="text-amber-700">{formatScore(r.total_score)}</b> из <b>{formatScore(r.total_max)}</b> возможных баллов в пройденных заданиях
          </div>
        </Card>
        <Card className="p-6" accent="#7C4DFF">
          <div className="text-sm text-content-secondary">Что делать дальше</div>
          {currentStep ? (
            <>
              <div className="mt-1 font-medium">{currentStep.title}</div>
              <div className="text-sm text-content-secondary">
                {currentStep.module.title} · {currentStep.lesson.title}
              </div>
              <ButtonLink to={`/courses/${courseId}/steps/${currentStep.id}`} className="mt-3 w-full">
                Продолжить →
              </ButtonLink>
            </>
          ) : (
            <div className="mt-1 text-lg font-medium text-status-success">🏆 Все шаги пройдены</div>
          )}
        </Card>
      </div>

      {/* Объяснение формулы */}
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-medium">Как считается рейтинг</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-amber-400/15 px-4 py-2 font-mono text-amber-800">
            {formatScore(r.total_score)} ÷ {formatScore(r.total_max)} × 100 = <b>{formatScore(r.score)}</b>
          </span>
          <span className="text-content-secondary">
            Сумма полученных баллов делится на сумму максимальных баллов за пройденные задания. Баллы за автопроверку и за оценку куратора
            считаются одинаково. Теория баллов не даёт, но двигает прогресс.
          </span>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-medium">Из чего сложился результат</h2>
          </div>
          {r.breakdown.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="🌱" title="Баллов пока нет">
                Пройдите первое задание — и здесь появится разбор.
              </EmptyState>
            </div>
          ) : (
            bySource.map(({ src, items }) => (
              <div key={src} className="p-2">
                <div className="flex items-center justify-between rounded-2xl px-4 py-2 text-sm font-medium" style={{ color: sourceMeta[src].color, backgroundColor: `${sourceMeta[src].color}14` }}>
                  <span>{sourceMeta[src].label}</span>
                  <span>
                    {formatScore(items.reduce((a, b) => a + b.score, 0))} / {formatScore(items.reduce((a, b) => a + b.max_score, 0))}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {items.map((b) => {
                    const type = resolveStepType(b.kind, null, b.step_id)
                    return (
                      <li key={b.step_id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-brand/5">
                        <StepTypeIcon type={type} size="sm" />
                        <Link to={`/courses/${courseId}/steps/${b.step_id}`} className="min-w-0 flex-1 truncate text-sm font-medium hover:text-brand-hover">
                          {b.title}
                        </Link>
                        <ProgressBar value={b.max_score ? (b.score / b.max_score) * 100 : 0} color="bg-gradient-to-r from-amber-300 to-amber-500" className="hidden w-24 sm:block" />
                        <ScorePill>
                          {formatScore(b.score)}/{formatScore(b.max_score)}
                        </ScorePill>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </Card>

        <div className="space-y-4">
          {lostPoints.length > 0 && (
            <Card className="p-6" accent="#F59E0B">
              <div className="font-medium">Где потеряны баллы</div>
              <ul className="mt-2 space-y-1 text-sm">
                {lostPoints.map((b) => (
                  <li key={b.step_id} className="flex justify-between gap-2">
                    <span className="truncate">{b.title}</span>
                    <span className="shrink-0 font-medium text-amber-700">−{formatScore(b.max_score - b.score)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="p-6" accent="#7C4DFF">
            <div className="font-medium">Ещё можно заработать</div>
            {toEarn.length === 0 ? (
              <p className="mt-1 text-sm text-content-secondary">Все оцениваемые задания выполнены.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {toEarn.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{s.title}</span>
                    <Badge color="#B45309">до {formatScore(s.max_score)}</Badge>
                  </li>
                ))}
                {toEarn.length > 8 && <li className="text-content-secondary">и ещё {toEarn.length - 8}…</li>}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
