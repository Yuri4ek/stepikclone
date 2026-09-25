import type { ReactNode } from 'react'
import type { Question } from '@/shared/api'
import { formatDate } from '@/shared/lib'
import { Badge, Icon } from '@/shared/ui'

/** Вопрос ученика и ответ куратора — одна пара, без переписки */
export function QuestionThread({ q, meta, children }: { q: Question; meta?: ReactNode; children?: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-ink-3">
        {meta}
        <span>{formatDate(q.created_at)}</span>
        {q.status === 'open' ? (
          <Badge icon="clock" className="bg-st-review-bg text-st-review">
            Ждёт ответа
          </Badge>
        ) : (
          <Badge icon="check" className="bg-st-done-bg text-st-done">
            Есть ответ
          </Badge>
        )}
      </div>
      <p className="whitespace-pre-wrap">{q.text}</p>
      {q.answer && (
        <div className="rounded-field bg-brand-mist p-4">
          <div className="eyebrow mb-1 flex items-center gap-1.5 text-brand-ink-3">
            <Icon name="message" size={14} />
            {q.answered_by?.full_name ?? 'Куратор'} · {formatDate(q.answered_at)}
          </div>
          <p className="whitespace-pre-wrap">{q.answer}</p>
        </div>
      )}
      {children}
    </div>
  )
}
