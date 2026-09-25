import type { FlatStep } from '@/entities/course'
import { resolveStepType } from '@/entities/step'
import type { StepStatus } from '@/shared/api'
import { cx } from '@/shared/lib'
import { ButtonLink, Icon } from '@/shared/ui'

const actionText: Partial<Record<StepStatus, string>> = {
  returned: 'Куратор вернул работу — поправь и отправь снова',
  failed: 'Попробуй ещё раз — результат будет сразу',
  submitted: 'Работа у куратора — можно идти дальше',
}


export function NextStepCard({ courseId, courseTitle, step, total, waiting = 0, className }: { courseId: string; courseTitle: string; step: FlatStep | null; total: number; waiting?: number; className?: string }) {
  if (!step) {
    return (
      <section className={cx('night-glow overflow-hidden rounded-card p-6 text-white sm:p-8', className)}>
        <div className="eyebrow text-brand-sky">{waiting ? 'Ждём куратора' : 'Курс пройден'}</div>
        <h2 className="mt-3 text-[28px] leading-tight font-extrabold sm:text-4xl">{waiting ? `Все шаги курса «${courseTitle}» сданы` : `Все шаги курса «${courseTitle}» зачтены`}</h2>
        <p className="mt-3 max-w-xl text-white/70">
          {waiting ? 'Осталось дождаться проверки работ. А пока загляни в итоги: там видно, из чего сложились твои баллы.' : 'Загляни в итоги: там видно, из чего сложились твои баллы.'}
        </p>
        <ButtonLink to={`/courses/${courseId}/progress`} size="lg" variant="dark" className="mt-6">
          Посмотреть итоги
          <Icon name="arrowRight" size={20} />
        </ButtonLink>
      </section>
    )
  }
  const type = resolveStepType(step.kind, step.type)
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
