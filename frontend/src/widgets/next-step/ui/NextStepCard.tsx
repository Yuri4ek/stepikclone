import type { FlatStep } from '@/entities/course'
import { resolveStepType } from '@/entities/step'
import type { StepStatus } from '@/shared/api'
import { cx } from '@/shared/lib'
import { ButtonLink, Icon } from '@/shared/ui'

const actionText: Partial<Record<StepStatus, string>> = {
  returned: 'Куратор вернул работу — поправь и отправь снова',
  failed: 'Попробуй ещё раз — результат будет сразу',
  submitted: 'Работа у куратора. Результат появится на шаге',
}

/**
 * «Следующий шаг» — самый крупный элемент главного экрана ученика (брендбук, принцип 1).
 * Тёмное свечение здесь — единственный разрешённый градиент.
 */
export function NextStepCard({ courseId, courseTitle, step, total, className }: { courseId: string; courseTitle: string; step: FlatStep | null; total: number; className?: string }) {
  if (!step) {
    return (
      <section className={cx('night-glow overflow-hidden rounded-card p-6 text-white sm:p-8', className)}>
        <div className="eyebrow text-brand-sky">Курс пройден</div>
        <h2 className="mt-3 text-[28px] leading-tight font-extrabold sm:text-4xl">Все шаги курса «{courseTitle}» зачтены</h2>
        <p className="mt-3 max-w-xl text-white/70">Загляни в итоги: там видно, из чего сложились твои баллы.</p>
        <ButtonLink to={`/courses/${courseId}/progress`} size="lg" variant="dark" className="mt-6">
          Посмотреть итоги
          <Icon name="arrowRight" size={20} />
        </ButtonLink>
      </section>
    )
  }
  const type = resolveStepType(step.kind, null, step.id)
  const hint = actionText[step.progress.status]
  return (
    <section className={cx('night-glow overflow-hidden rounded-card p-6 text-white sm:p-8', className)}>
      <div className="eyebrow num text-brand-sky">
        Следующий шаг · {step.index} из {total}
      </div>
      <h2 className="mt-3 text-[28px] leading-tight font-extrabold tracking-tight sm:text-4xl">{step.title}</h2>
      <p className="mt-3 text-white/70">
        {type.label} · курс «{courseTitle}»
      </p>
      {hint && <p className="mt-2 font-semibold text-white">{hint}</p>}
      <ButtonLink to={`/courses/${courseId}/steps/${step.id}`} size="lg" className="mt-6">
        Продолжить
        <Icon name="arrowRight" size={20} />
      </ButtonLink>
    </section>
  )
}
