import type { FlatStep } from '@/entities/course'
import type { CourseProgress } from '@/shared/api'
import { cx, formatScore, plural } from '@/shared/lib'
import { Card, SegmentBar } from '@/shared/ui'


export function RatingBreakdown({ progress, steps, className }: { progress: CourseProgress; steps: FlatStep[]; className?: string }) {
  const r = progress.rating
  const auto = r.breakdown.filter((b) => b.source === 'auto')
  const manual = r.breakdown.filter((b) => b.source === 'manual')
  const sum = (xs: { score: number }[]) => xs.reduce((a, b) => a + b.score, 0)
  const autoPts = sum(auto)
  const manualPts = sum(manual)
  // Максимум курса берём у бэкенда: сумма max_score по обязательным шагам (формула rating)
  const courseMax = r.total_max
  const earned = new Set(r.breakdown.map((b) => b.step_id))
  const nextScored = steps.find((s) => s.max_score > 0 && !earned.has(s.id) && s.progress.status !== 'submitted' && s.progress.status !== 'locked') ?? steps.find((s) => s.max_score > 0 && !earned.has(s.id) && s.progress.status !== 'submitted')
  const pending = r.pending_max ?? 0

  const rows = [
    { label: 'Задания с автопроверкой', count: auto.length, pts: autoPts, dot: 'bg-brand-blue' },
    { label: 'Работы, принятые куратором', count: manual.length, pts: manualPts, dot: 'bg-brand-sky' },
  ]

  return (
    <Card className={cx('p-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="num text-5xl leading-none font-extrabold">{formatScore(r.total_score)}</span>
          <span className="text-brand-ink-2">{plural(Math.round(r.total_score), 'балл', 'балла', 'баллов')}</span>
        </div>
        <span className="num text-sm text-brand-ink-2">из {formatScore(courseMax)} возможных в курсе</span>
      </div>

      <SegmentBar
        className="mt-5"
        total={courseMax}
        segments={[
          { label: 'Автопроверка', value: autoPts, className: 'bg-brand-blue' },
          { label: 'Куратор', value: manualPts, className: 'bg-brand-sky' },
          { label: 'На проверке', value: pending, className: 'bg-st-review/40' },
        ]}
      />

      <ul className="mt-5 space-y-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-3">
            <span className={cx('size-3 shrink-0 rounded-[3px]', row.dot)} aria-hidden />
            <span className="flex-1">
              {row.label} · <span className="num">{row.count}</span>
            </span>
            <span className="num font-bold">{formatScore(row.pts)}</span>
          </li>
        ))}
        {pending > 0 && (
          <li className="flex items-center gap-3">
            <span className="size-3 shrink-0 rounded-[3px] bg-st-review/40" aria-hidden />
            <span className="flex-1">Ждут проверки куратора — до</span>
            <span className="num font-bold">{formatScore(pending)}</span>
          </li>
        )}
        <li className="flex items-center gap-3 text-brand-ink-2">
          <span className="size-3 shrink-0 rounded-[3px] bg-brand-line" aria-hidden />
          <span className="flex-1">Ещё можно получить</span>
          <span className="num font-bold">{formatScore(Math.max(0, courseMax - r.total_score - lost(r.breakdown) - pending))}</span>
        </li>
      </ul>

      <div className="mt-5 border-t border-brand-line pt-4 text-sm text-brand-ink-2">
        {nextScored ? (
          <>
            Следующее задание с баллами — «{nextScored.title}», за него можно получить до <span className="num font-semibold text-brand-ink">{formatScore(nextScored.max_score)}</span>.
          </>
        ) : progress.percent >= 100 ? (
          'Все задания с баллами выполнены.'
        ) : (
          'Задания с баллами ждут проверки куратора — баллы появятся здесь сразу после неё.'
        )}
      </div>
    </Card>
  )
}


function lost(items: { score: number; max_score: number }[]) {
  return items.reduce((a, b) => a + Math.max(0, b.max_score - b.score), 0)
}
