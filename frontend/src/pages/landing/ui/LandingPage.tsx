import { STEP_TYPES, StepTypeIcon, checkLabels } from '@/entities/step'
import { roleMeta } from '@/entities/user'
import { ButtonLink, Card, Icon, StatusPill, type IconName, type StatusTone } from '@/shared/ui'

const roles: { role: 'student' | 'curator' | 'admin'; icon: IconName; points: string[] }[] = [
  { role: 'student', icon: 'flag', points: ['Проходит курс в своём темпе', 'Сразу видит результат автопроверки', 'Всегда знает следующий шаг', 'Понимает, из чего сложились баллы'] },
  { role: 'curator', icon: 'inbox', points: ['Проверяет то, что не проверит машина', 'Возвращает работу с комментарием', 'Видит отставание раньше, чем ученик бросит'] },
  { role: 'admin', icon: 'layers', points: ['Собирает курс из шагов разных типов', 'Публикует и меняет курсы', 'Назначает кураторов'] },
]

const statuses: StatusTone[] = ['done', 'review', 'returned', 'failed', 'progress', 'idle']

export function LandingPage() {
  return (
    <div className="space-y-16">
      {/* Первый экран — «Ночь» со свечением */}
      <section className="night-glow overflow-hidden rounded-card px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
          <span className="size-1.5 rounded-full bg-brand-amber" aria-hidden />
          Федерация спортивного программирования Чувашской Республики
        </div>
        <h1 className="mt-6 max-w-4xl text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
          Спортивное программирование для школьников 1–9 классов<span className="text-brand-sky">.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70">
          Ученик проходит курс сам, автопроверка отвечает сразу, куратор сопровождает и проверяет творческие работы, администратор собирает курсы из шагов.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to="/register" size="lg">
            Начать учиться
            <Icon name="arrowRight" size={20} />
          </ButtonLink>
          <ButtonLink to="/login" size="lg" variant="dark">
            У меня есть аккаунт
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {roles.map((r) => (
          <Card key={r.role} className="p-6">
            <span className="flex size-12 items-center justify-center rounded-btn bg-brand-blue-50 text-brand-blue">
              <Icon name={r.icon} size={24} />
            </span>
            <h2 className="mt-4 text-xl font-bold">{roleMeta[r.role].label}</h2>
            <ul className="mt-3 space-y-2 text-brand-ink-2">
              {r.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-brand-blue" />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-[28px] font-bold tracking-tight sm:text-4xl">Курс собирается из разных шагов</h2>
        <p className="mt-2 max-w-2xl text-brand-ink-2">У каждого инструмента — свой тип шага. Новые типы добавляются без переписывания платформы.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEP_TYPES.map((t) => (
            <Card key={t.id} className="p-5">
              <StepTypeIcon type={t} />
              <div className="mt-4 font-bold">{t.label}</div>
              <div className="mt-1 text-sm text-brand-ink-2">{t.description}</div>
              <div className="eyebrow mt-3 text-brand-ink-3">{checkLabels[t.check]}</div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[28px] font-bold tracking-tight sm:text-4xl">Статус всегда понятен</h2>
        <p className="mt-2 max-w-2xl text-brand-ink-2">У каждого статуса свой цвет и значок — ученик, куратор и родители читают их одинаково.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {statuses.map((s) => (
            <StatusPill key={s} tone={s} />
          ))}
        </div>
      </section>

      <section className="rounded-card border border-brand-line bg-white px-6 py-12 text-center sm:px-12">
        <h2 className="text-[28px] font-bold tracking-tight sm:text-4xl">Первый шаг — через минуту</h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-ink-2">Зарегистрируйся, выбери курс и начинай с теории. Прогресс и баллы видны сразу.</p>
        <ButtonLink to="/register" size="lg" className="mt-7">
          Начать учиться
        </ButtonLink>
      </section>
    </div>
  )
}
