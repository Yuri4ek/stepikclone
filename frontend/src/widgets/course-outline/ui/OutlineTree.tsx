import { useState } from 'react'
import { Link } from 'react-router-dom'
import { lessonStats } from '@/entities/course'
import { StatusBadge, StepTypeIcon, resolveStepType } from '@/entities/step'
import type { Outline, OutlineStep } from '@/shared/api'
import { cx, formatScore } from '@/shared/lib'
import { Card, Icon } from '@/shared/ui'

export function StepRow({ step, courseId, enrolled, current }: { step: OutlineStep; courseId: string; enrolled: boolean; current?: boolean }) {
  const type = resolveStepType(step.kind, step.type)
  const locked = !enrolled || step.progress.status === 'locked'
  const inner = (
    <>
      <StepTypeIcon type={type} size="sm" />
      <span className="min-w-0 flex-1">
        <span className={cx('block truncate font-semibold', current && 'text-brand-blue')}>{step.title}</span>
        <span className="text-sm text-brand-ink-3">
          {type.label}
          {step.max_score > 0 && (
            <>
              {' · '}
              <span className="num">
                {step.progress.score !== null ? `${formatScore(step.progress.score)} из ${formatScore(step.max_score)}` : `до ${formatScore(step.max_score)}`} баллов
              </span>
            </>
          )}
          {!step.is_required && ' · по желанию'}
        </span>
      </span>
      {enrolled && <StatusBadge status={step.progress.status} />}
    </>
  )
  const cls = cx('flex items-center gap-3 rounded-btn px-3 py-2.5 transition-colors', current && 'bg-brand-blue-50')
  return locked ? (
    <div className={cls}>{inner}</div>
  ) : (
    <Link to={`/courses/${courseId}/steps/${step.id}`} className={cx(cls, !current && 'hover:bg-brand-mist')}>
      {inner}
    </Link>
  )
}

function ModuleCount({ steps }: { steps: OutlineStep[] }) {
  const passed = steps.filter((s) => s.progress.status === 'passed').length
  return (
    <span className={cx('num shrink-0 text-sm', passed === steps.length && steps.length > 0 ? 'font-semibold text-st-done' : 'text-brand-ink-3')}>
      {passed} из {steps.length}
    </span>
  )
}

export function OutlineTree({ outline, enrolled, currentId }: { outline: Outline; enrolled: boolean; currentId?: string }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  return (
    <div className="space-y-4">
      {outline.modules.map((m, mi) => (
        <Card key={m.id}>
          <div className="flex items-end justify-between gap-3 px-5 pt-5 pb-1">
            <div>
              <div className="eyebrow text-brand-blue">Модуль {mi + 1}</div>
              <h2 className="mt-1 text-xl font-bold">{m.title}</h2>
            </div>
            {enrolled && <ModuleCount steps={m.lessons.flatMap((l) => l.steps)} />}
          </div>
          {m.lessons.length === 1 && m.lessons[0].title === m.title ? (
            // Модуль из одного урока с тем же названием (так устроен пакет содержания) — шаги сразу под модулем
            <div className="space-y-0.5 p-2">
              {m.lessons[0].steps.map((s) => (
                <StepRow key={s.id} step={s} courseId={outline.course.id} enrolled={enrolled} current={s.id === currentId} />
              ))}
              {m.lessons[0].steps.length === 0 && <div className="px-3 py-2 text-sm text-brand-ink-3">В модуле пока нет шагов</div>}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {m.lessons.map((l, li) => {
                const st = lessonStats(l)
                const open = !collapsed[l.id]
                return (
                  <div key={l.id}>
                    <button className="flex w-full items-center gap-3 rounded-btn px-3 py-3 text-left hover:bg-brand-mist" onClick={() => setCollapsed({ ...collapsed, [l.id]: open })} aria-expanded={open}>
                      <span className={cx('num flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', st.done ? 'bg-st-done text-white' : 'bg-st-idle-bg text-brand-ink-2')}>
                        {st.done ? <Icon name="check" size={16} strokeWidth={2.4} /> : `${mi + 1}.${li + 1}`}
                      </span>
                      <span className="flex-1 font-semibold">{l.title}</span>
                      {enrolled && (
                        <span className="num text-sm text-brand-ink-3">
                          {st.passed} из {st.total}
                        </span>
                      )}
                      <Icon name="chevronRight" size={18} className={cx('text-brand-ink-3 transition-transform', open && 'rotate-90')} />
                    </button>
                    {open && (
                      <div className="space-y-0.5 pb-2 pl-2">
                        {l.steps.map((s) => (
                          <StepRow key={s.id} step={s} courseId={outline.course.id} enrolled={enrolled} current={s.id === currentId} />
                        ))}
                        {l.steps.length === 0 && <div className="px-3 py-2 text-sm text-brand-ink-3">В уроке пока нет шагов</div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
