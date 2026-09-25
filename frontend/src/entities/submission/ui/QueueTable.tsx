import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { QueueItem } from '@/shared/api'
import { cx, formatDate, hoursSince, waitLabel } from '@/shared/lib'
import { ButtonLink, Icon } from '@/shared/ui'


export function QueueTable({ items, studentMeta, stepIcon }: { items: QueueItem[]; studentMeta?: (item: QueueItem) => ReactNode; stepIcon?: (item: QueueItem) => ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-sm">
        <thead>
          <tr className="border-b border-brand-line bg-brand-mist text-left">
            <th className="eyebrow px-4 py-3 text-brand-ink-3">Ученик</th>
            <th className="eyebrow px-4 py-3 text-brand-ink-3">Шаг</th>
            <th className="eyebrow px-4 py-3 text-brand-ink-3">Ответ</th>
            <th className="eyebrow px-4 py-3 text-right text-brand-ink-3">Ждёт</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const overdue = hoursSince(it.submitted_at) > 24
            return (
              <tr key={it.submission_id} className="border-b border-brand-line last:border-0 hover:bg-brand-mist/60">
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold">{it.student.full_name}</div>
                  {studentMeta?.(it)}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex gap-3">
                    {stepIcon?.(it)}
                    <div>
                      <Link to={`/curator/review/${it.submission_id}`} className="font-semibold hover:text-brand-blue">
                        {it.step_title}
                      </Link>
                      <div className="text-xs text-brand-ink-3">{it.course_title}</div>
                    </div>
                  </div>
                </td>
                <td className="max-w-64 px-4 py-3 align-top text-brand-ink-2">
                  <span className="line-clamp-2 break-all">{it.preview || '—'}</span>
                  {it.has_screenshot && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-brand-ink-3">
                      <Icon name="image" size={14} />
                      скриншот
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right align-top whitespace-nowrap" title={`Сдано ${formatDate(it.submitted_at)}`}>
                  <span className={cx('num font-mono', overdue ? 'font-semibold text-brand-amber-text' : 'text-brand-ink')}>{waitLabel(it.submitted_at)}</span>
                </td>
                <td className="px-4 py-3 text-right align-top">
                  <ButtonLink to={`/curator/review/${it.submission_id}`} variant="secondary" size="sm">
                    Открыть
                  </ButtonLink>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
