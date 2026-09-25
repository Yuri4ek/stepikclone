import type { ReactNode } from 'react'
import type { CatalogCourse } from '@/shared/api'
import { formatPercent } from '@/shared/lib'
import { Card, Icon, ProgressBar } from '@/shared/ui'
import { courseCoverStyle } from '../lib/cover'

/** Карточка курса из каталога. Кнопки действий передаются снаружи — их собирают фичи и виджеты */
export function CourseCard({ course, actions, footer }: { course: CatalogCourse; actions?: ReactNode; footer?: ReactNode }) {
  const e = course.enrollment
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative h-28 p-5 text-white" style={courseCoverStyle(course)}>
        {!course.cover_url && <Icon name="code" size={32} className="opacity-80" />}
        {e && <span className="absolute top-4 right-4 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-ink">Уже учишься</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg leading-snug font-bold">{course.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-brand-ink-2">{course.description || 'Описание скоро появится'}</p>
        {e && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-ink-2">Пройдено</span>
              <span className="num font-semibold">{formatPercent(e.percent)}</span>
            </div>
            <ProgressBar value={e.percent} />
          </div>
        )}
        {footer}
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </Card>
  )
}
