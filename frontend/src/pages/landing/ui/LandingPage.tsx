import { STEP_TYPES, StepTypeIcon, checkLabels } from '@/entities/step'
import { roleMeta } from '@/entities/user'
import { ButtonLink, Card } from '@/shared/ui'

const roles = [
  { role: 'student' as const, icon: '🎒', points: ['Проходит курс в своём темпе', 'Сразу видит результат автопроверки', 'Всегда знает следующий шаг', 'Понимает, из чего сложился рейтинг'] },
  { role: 'curator' as const, icon: '🧭', points: ['Проверяет то, что не проверит машина', 'Возвращает работу с комментарием', 'Видит отстающих раньше, чем они бросят'] },
  { role: 'admin' as const, icon: '🧱', points: ['Собирает курс из шагов разных типов', 'Публикует и меняет курсы', 'Назначает кураторов'] },
]

export function LandingPage() {
  return (
    <>
      <div>
        {/* Hero */}
        <section className="relative pt-8 pb-16 text-center sm:pt-12 sm:pb-24">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-1.5 text-sm text-content-secondary backdrop-blur">
            <span className="size-2 rounded-full bg-brand-crimson" aria-hidden />
            Федерация спортивного программирования Чувашской Республики
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl leading-[1.08] font-medium tracking-tight sm:text-6xl">
            Спортивное программирование <span className="text-brand-gradient">для школьников 1–9 классов</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-content-secondary">
            Ученик проходит курс сам, автопроверка отвечает сразу, куратор сопровождает и проверяет творческие работы, администратор собирает курсы из шагов.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/register" className="px-7 py-3.5 text-base">
              Зарегистрироваться
            </ButtonLink>
            <ButtonLink to="/login" variant="secondary" className="px-7 py-3.5 text-base">
              У меня есть аккаунт
            </ButtonLink>
          </div>
        </section>

        {/* Роли */}
        <section className="grid gap-4 md:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.role} className="p-7" accent={roleMeta[r.role].color}>
              <div className="flex size-14 items-center justify-center rounded-2xl text-2xl text-white shadow-lg" style={{ backgroundImage: roleMeta[r.role].gradient }}>
                {r.icon}
              </div>
              <h2 className="mt-5 text-xl font-medium">{roleMeta[r.role].label}</h2>
              <ul className="mt-3 space-y-2 text-sm text-content-secondary">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span style={{ color: roleMeta[r.role].color }}>●</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </section>

        {/* Типы шагов */}
        <section className="py-20">
          <h2 className="text-center text-3xl font-medium tracking-tight sm:text-4xl">Курс собирается из разных шагов</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-content-secondary">
            У каждого инструмента — свой тип шага. Новые типы добавляются без переписывания платформы.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEP_TYPES.map((t) => (
              <Card key={t.id} className="p-6 transition-transform hover:-translate-y-1" accent={t.color}>
                <StepTypeIcon type={t} />
                <div className="mt-4 font-medium">{t.label}</div>
                <div className="mt-1 text-sm text-content-secondary">{t.description}</div>
                <div className="mt-3 text-xs font-medium" style={{ color: t.color }}>
                  {checkLabels[t.check]}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-gradient relative overflow-hidden rounded-[36px] px-8 py-14 text-center text-white">
          <div className="absolute -top-20 -left-10 size-72 rounded-full bg-brand-sky/40 blur-3xl" aria-hidden />
          <div className="absolute -right-10 -bottom-24 size-72 rounded-full bg-fuchsia-400/40 blur-3xl" aria-hidden />
          <h2 className="relative text-3xl font-medium tracking-tight sm:text-4xl">Первый шаг — через минуту</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">Зарегистрируйтесь, выберите курс и начинайте с теории. Прогресс и рейтинг видны сразу.</p>
          <ButtonLink to="/register" variant="secondary" className="relative mt-7 !bg-white px-7 py-3.5 text-base !text-brand hover:!bg-white/90">
            Начать бесплатно
          </ButtonLink>
        </section>
      </div>
    </>
  )
}
