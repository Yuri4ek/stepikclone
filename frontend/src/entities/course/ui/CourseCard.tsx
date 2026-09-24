import type { ReactNode } from 'react'
import type { CatalogCourse } from '@/shared/api'
import { formatPercent } from '@/shared/lib'
import { Card, ProgressBar, ScorePill } from '@/shared/ui'
import { courseCoverStyle } from '../lib/cover'

/** Карточка курса из каталога. Кнопки действий передаются снаружи — их собирают фичи и виджеты */
export function CourseCard({ course, actions, footer }: { course: CatalogCourse; actions?: ReactNode; footer?: ReactNode }) {
  const e = course.enrollment
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative m-2 h-32 overflow-hidden rounded-[22px] p-5 text-white" style={courseCoverStyle(course)}>
        <div className="absolute -right-8 -bottom-12 size-40 rounded-full bg-white/20 blur-2xl" aria-hidden />
        {!course.cover_url && <div className="relative font-mono text-3xl font-medium opacity-90">{'{ }'}</div>}
        {e && <span className="absolute top-4 right-4 rounded-full bg-white/25 px-3 py-1 text-xs font-medium backdrop-blur">Вы записаны</span>}
      </div>
      <div className="flex flex-1 flex-col px-5 pt-3 pb-5">
        <h3 className="text-lg leading-snug font-medium">{course.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-content-secondary">{course.description || 'Описание скоро появится'}</p>
        {e && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-content-secondary">Пройдено {formatPercent(e.percent)}</span>
              <ScorePill>{Math.round(e.rating_score)} рейтинг</ScorePill>
            </div>
            <ProgressBar value={e.percent} />
          </div>
        )}
        {footer}
        {actions && <div className="mt-4 flex gap-2">{actions}</div>}
      </div>
    </Card>
  )
}
