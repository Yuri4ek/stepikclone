import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { FlatStep } from '@/entities/course'
import { resolveStepType, stepStatusMeta, stepTone } from '@/entities/step'
import { cx } from '@/shared/lib'
import { Icon } from '@/shared/ui'

/**
 * Карта курса — «где я и что дальше» (брендбук, раздел 06).
 * Узел: иконка типа шага; цвет и значок в углу — статус. Текущий шаг выделен синим ореолом,
 * другие элементы так не выделяются.
 */
export function CourseMap({ steps, currentId, courseId, compact }: { steps: FlatStep[]; currentId?: string; courseId: string; compact?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = currentRef.current
    const box = scroller.current
    if (el && box) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [currentId, steps.length])

  return (
    <div ref={scroller} className="overflow-x-auto pb-1">
      <ol className="flex min-w-max items-start px-2 pt-2">
        {steps.map((s, i) => {
          const type = resolveStepType(s.kind, s.type)
          const st = s.progress.status
          const tone = stepTone[st]
          const meta = stepStatusMeta(st)
          const current = s.id === currentId
          const locked = st === 'locked'
          const nodeCls = cx(
            'relative flex size-12 items-center justify-center rounded-btn transition-transform',
            current ? 'bg-brand-blue text-white ring-[6px] ring-brand-blue-200' : meta.node,
            !locked && !current && 'hover:-translate-y-0.5',
          )
          const node = (
            <>
              <span className={nodeCls}>
                <Icon name={type.icon} size={22} />
                {tone !== 'progress' && tone !== 'idle' && !current && (
                  <span className={cx('absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full ring-2 ring-white', tone === 'done' ? 'bg-st-done text-white' : meta.badge)}>
                    <Icon name={meta.icon} size={12} strokeWidth={2.6} />
                  </span>
                )}
              </span>
              <span className={cx('mt-2 line-clamp-2 w-24 text-center text-xs leading-tight', current ? 'font-bold text-brand-blue' : 'text-brand-ink-2')}>{s.title}</span>
            </>
          )
          const label = `Шаг ${s.index}: ${s.title} — ${type.label}, ${current ? 'текущий шаг' : meta.label}`
          return (
            <li key={s.id} className="flex items-start">
              {i > 0 && <span className={cx('mt-6 h-0.5 shrink-0', compact ? 'w-4' : 'w-6', steps[i - 1].progress.status === 'passed' ? 'bg-st-done' : 'bg-brand-line')} aria-hidden />}
              <div ref={current ? currentRef : undefined} className="flex flex-col items-center">
                {locked ? (
                  <span className="flex cursor-not-allowed flex-col items-center" title={label} aria-label={label}>
                    {node}
                  </span>
                ) : (
                  <Link to={`/courses/${courseId}/steps/${s.id}`} className="flex flex-col items-center" title={label} aria-label={label} aria-current={current ? 'step' : undefined}>
                    {node}
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
