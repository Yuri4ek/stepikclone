import { useState } from 'react'
import { StepTypeIcon } from '../components/StepTypeBadge'
import { ButtonLink, Card, PageHeader, cx } from '../components/ui'
import { STEP_TYPES, checkLabels } from '../steps/registry'

const statuses = [
  { label: 'Доступен', color: '#3D5AFE', text: 'Шаг открыт — можно проходить.' },
  { label: 'На проверке', color: '#D97706', text: 'Работа у куратора. Пока можно идти дальше.' },
  { label: 'Возвращено', color: '#EF4444', text: 'Куратор оставил комментарий — исправьте и отправьте снова.' },
  { label: 'Пройден', color: '#059669', text: 'Шаг засчитан, баллы добавлены в рейтинг.' },
  { label: 'Закрыт', color: '#94A3B8', text: 'Откроется, когда будут пройдены предыдущие шаги.' },
]

const faq = [
  {
    q: 'Как считается рейтинг?',
    a: 'Рейтинг = сумма полученных баллов ÷ сумма максимальных баллов за пройденные задания × 100. На странице «Мой рейтинг» видно, сколько баллов дал каждый шаг и где их потеряно.',
  },
  {
    q: 'Оценка куратора влияет так же, как автопроверка?',
    a: 'Да. Баллы, которые ставит куратор, считаются в рейтинге и прогрессе точно так же, как баллы автопроверки.',
  },
  {
    q: 'Что будет, если ответить на тест неверно?',
    a: 'Результат покажется сразу, а шаг снова станет доступен — можно попробовать ещё раз.',
  },
  {
    q: 'Как проверяются задачи на программирование?',
    a: 'Кнопка «Запустить тесты» прогоняет решение по набору тестов прямо в браузере и сразу показывает, какие тесты не прошли. После отправки куратор подтверждает результат и ставит баллы.',
  },
  {
    q: 'Как куратор узнаёт, что ученик отстаёт?',
    a: 'Платформа отмечает учеников, которые не заходили 3 и более дней или медленно продвигаются («Внимание»), и тех, кто не заходил неделю («Критично»). Куратор видит список и может написать им заранее.',
  },
]

export function HelpPage() {
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-12">
      <PageHeader title="Как это работает" subtitle="Шаги курса, проверка заданий, прогресс и рейтинг" />

      <section>
        <h2 className="mb-2 text-2xl font-medium tracking-tight">Типы шагов</h2>
        <p className="mb-6 text-content-secondary">Каждый шаг отмечен своим цветом и значком — так сразу понятно, что нужно сделать.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEP_TYPES.map((t) => (
            <Card key={t.id} className="flex gap-4 p-6" accent={t.color}>
              <StepTypeIcon type={t} />
              <div>
                <div className="font-medium">{t.label}</div>
                <div className="mt-1 text-sm text-content-secondary">{t.description}</div>
                <div className="mt-2 text-xs font-medium" style={{ color: t.color }}>
                  {checkLabels[t.check]}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-7" accent="#3D5AFE">
          <div className="text-3xl">⚡</div>
          <h3 className="mt-3 text-xl font-medium">Автоматическая проверка</h3>
          <p className="mt-2 text-sm text-content-secondary">Тесты, задачи с ответом и задачи с прогоном по тестам. Результат приходит сразу после отправки.</p>
        </Card>
        <Card className="p-7" accent="#7C4DFF">
          <div className="text-3xl">🧑‍🏫</div>
          <h3 className="mt-3 text-xl font-medium">Ручная проверка</h3>
          <p className="mt-2 text-sm text-content-secondary">
            Проекты Scratch, задания в Minecraft, файлы и ссылки уходят куратору. Он принимает работу с оценкой или возвращает с комментарием — статус и причина видны на шаге и в «Моих работах».
          </p>
        </Card>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-medium tracking-tight">Статусы шага</h2>
        <div className="flex flex-wrap gap-3">
          {statuses.map((s) => (
            <div key={s.label} className="glass flex max-w-xs items-start gap-3 rounded-3xl px-5 py-4">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span>
                <span className="block font-medium">{s.label}</span>
                <span className="block text-sm text-content-secondary">{s.text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-medium tracking-tight">Частые вопросы</h2>
        <div className="space-y-2">
          {faq.map((f, i) => (
            <Card key={f.q} className="overflow-hidden">
              <button className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {f.q}
                <span className={cx('flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand transition-transform', open === i && 'rotate-45')}>+</span>
              </button>
              {open === i && <p className="px-6 pb-5 text-content-secondary">{f.a}</p>}
            </Card>
          ))}
        </div>
      </section>

      <div className="text-center">
        <ButtonLink to="/">К обучению</ButtonLink>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <div className="text-brand-gradient text-8xl font-medium tracking-tight">404</div>
      <h1 className="mt-4 text-2xl font-medium">Такой страницы нет</h1>
      <p className="mt-2 text-content-secondary">Возможно, ссылка устарела или в адресе опечатка.</p>
      <ButtonLink to="/" className="mt-6">
        На главную
      </ButtonLink>
    </div>
  )
}
