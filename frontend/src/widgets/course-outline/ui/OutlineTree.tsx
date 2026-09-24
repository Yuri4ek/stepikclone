import { useState } from 'react'
import { Link } from 'react-router-dom'
import { lessonStats } from '@/entities/course'
import { StatusBadge, StepTypeIcon, resolveStepType } from '@/entities/step'
import type { Outline, OutlineStep } from '@/shared/api'
import { cx, formatScore } from '@/shared/lib'
import { Card, ScorePill } from '@/shared/ui'

export function StepRow({ step, courseId, enrolled, current }: { step: OutlineStep; courseId: string; enrolled: boolean; current?: boolean }) {
  const type = resolveStepType(step.kind, null, step.id)
  const locked = !enrolled || step.progress.status === 'locked'
  const inner = (
    <>
      <StepTypeIcon type={type} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{step.title}</span>
        <span className="text-xs text-content-secondary">
          {type.label}
          {step.max_score > 0 && ` · до ${formatScore(step.max_score)} баллов`}
          {!step.is_required && ' · необязательный'}
        </span>
      </span>
      {step.progress.score !== null && step.max_score > 0 && (
        <ScorePill>
          {formatScore(step.progress.score)}/{formatScore(step.max_score)}
        </ScorePill>
      )}
      {enrolled && <StatusBadge status={step.progress.status} />}
    </>
  )
  const cls = cx('flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors', current && 'bg-brand/10')
  return locked ? (
    <div className={cx(cls, 'opacity-60')}>{inner}</div>
  ) : (
    <Link to={`/courses/${courseId}/steps/${step.id}`} className={cx(cls, 'hover:bg-brand/5')}>
      {inner}
    </Link>
  )
}

export function OutlineTree({ outline, enrolled, currentId }: { outline: Outline; enrolled: boolean; currentId?: string }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  return (
    <div className="space-y-4">
      {outline.modules.map((m, mi) => (
        <Card key={m.id}>
          <div className="px-6 pt-6 pb-2">
            <div className="text-sm text-brand-violet">Модуль {mi + 1}</div>
            <h2 className="text-xl font-medium">{m.title}</h2>
          </div>
          <div className="space-y-1 p-2">
            {m.lessons.map((l, li) => {
              const st = lessonStats(l)
              const open = !collapsed[l.id]
              return (
                <div key={l.id}>
                  <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-brand/5" onClick={() => setCollapsed({ ...collapsed, [l.id]: open })} aria-expanded={open}>
                    <span className={cx('flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium', st.done ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' : 'bg-brand/10 text-brand')}>
                      {st.done ? '✓' : `${mi + 1}.${li + 1}`}
                    </span>
                    <span className="flex-1 font-medium">{l.title}</span>
                    {enrolled && (
                      <span className="text-xs text-content-secondary">
                        {st.passed}/{st.total}
                      </span>
                    )}
                    <span className={cx('text-content-secondary transition-transform', open && 'rotate-90')}>›</span>
                  </button>
                  {open && (
                    <div className="space-y-0.5 px-1 pb-2">
                      {l.steps.map((s) => (
                        <StepRow key={s.id} step={s} courseId={outline.course.id} enrolled={enrolled} current={s.id === currentId} />
                      ))}
                      {l.steps.length === 0 && <div className="px-3 py-2 text-sm text-content-secondary">В уроке пока нет шагов</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}
    </div>
  )
}
