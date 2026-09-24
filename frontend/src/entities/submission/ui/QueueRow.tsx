import { Link } from 'react-router-dom'
import type { QueueItem } from '@/shared/api'
import { cx, formatDate, hoursSince, waitLabel } from '@/shared/lib'

export function QueueRow({ item }: { item: QueueItem }) {
  const overdue = hoursSince(item.submitted_at) > 24
  return (
    <Link to={`/curator/review/${item.submission_id}`} className="flex flex-col gap-2 rounded-3xl px-4 py-4 transition-colors hover:bg-brand/5 sm:flex-row sm:items-center sm:gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-brand-violet font-medium text-white shadow-md" aria-hidden>
        {item.student.full_name.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{item.student.full_name}</span>
          <span className="text-sm text-content-secondary">{item.step_title}</span>
        </div>
        <div className="text-xs text-content-secondary">{item.course_title}</div>
        {item.preview && <div className="mt-1 line-clamp-1 text-sm text-content-secondary italic">«{item.preview}»</div>}
      </div>
      <div className="shrink-0 text-right text-xs">
        <div className={cx('font-medium', overdue ? 'text-status-error' : 'text-content-secondary')}>ждёт {waitLabel(item.submitted_at)}</div>
        <div className="text-content-secondary">{formatDate(item.submitted_at)}</div>
      </div>
    </Link>
  )
}
