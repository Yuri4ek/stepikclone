import { useState } from 'react'
import { STEP_TYPES, StepTypeIcon, checkLabels } from '@/entities/step'
import { cx } from '@/shared/lib'
import { ButtonLink, Card, Icon, PageHeader, SectionLabel, StatusPill, type StatusTone } from '@/shared/ui'

const statuses: { tone: StatusTone; text: string }[] = [
  { tone: 'progress', text: 'Шаг открыт, ответ ещё не отправлен.' },
  { tone: 'review', text: 'Работа в очереди у куратора. Результат появится на шаге, а пока можно идти дальше.' },
  { tone: 'returned', text: 'Куратор оставил комментарий — поправь работу и отправь снова.' },
  { tone: 'failed', text: 'Ответ не совпал или не все тесты прошли. Можно отправить снова, результат будет сразу.' },
  { tone: 'done', text: 'Автопроверка пройдена или куратор принял работу. Баллы уже в прогрессе.' },
  { tone: 'idle', text: 'Шаг откроется, когда ты выполнишь предыдущий: ответишь верно, прочитаешь теорию или сдашь работу куратору.' },
]

const faq = [
  {
    q: 'Как считаются баллы?',
    a: 'За каждое задание с проверкой можно получить баллы — сколько именно, написано на шаге. Рейтинг в курсе = полученные баллы ÷ все баллы обязательных заданий курса × 100. На странице «Прогресс и баллы» видно, сколько дала автопроверка, сколько — куратор, сколько ждёт проверки и сколько ещё можно получить. Там же — место в группе курса и серия дней подряд.',
  },
  {
    q: 'Оценка куратора влияет так же, как автопроверка?',
    a: 'Да. «Зачтено» от куратора и «Зачтено» от автопроверки выглядят одинаково и одинаково двигают прогресс. Кто проверил, написано мелко под статусом.',
  },
  {
    q: 'Можно ли идти дальше, пока куратор проверяет работу?',
    a: 'Да. Сданная работа не блокирует курс: следующий шаг открывается сразу. Если куратор вернёт работу с комментарием, она появится на главной — поправь и отправь снова.',
  },
  {
    q: 'Что делать, если непонятно задание?',
    a: 'Внизу каждого шага есть «Вопрос куратору». Вопрос привязан к шагу, и ответ появится там же.',
  },
  {
    q: 'Что будет, если ответ не совпал?',
    a: 'Результат покажется сразу, а шаг снова станет доступен — можно попробовать ещё раз.',
  },
  {
    q: 'Как проверяются задачи с тестами?',
    a: 'Решение на Python уходит на сервер и прогоняется по всем тестам задачи — как на олимпиаде. Результат приходит сразу: сколько тестов прошло и что случилось на первом непройденном (неверный ответ, превышено время, ошибка). Входные данные видны только у примеров из условия, остальные тесты скрыты. «Проверить на примерах» запускает решение прямо в браузере и попытку не тратит.',
  },
  {
    q: 'Как куратор узнаёт, что ученик отстаёт?',
    a: 'Платформа ловит ранние сигналы, пока ученик ещё заходит: несколько дней без продвижения, несколько неудачных попыток на одном шаге, возвращённая работа, которую не исправляют, заметное отставание от группы. Такие ученики — «Замедлился»; кто не заходит неделю или давно стоит на месте — «Выпадает». Куратор видит список с причинами и может написать заранее. Ученик эти пометки не видит.',
  },
]

export function HelpPage() {
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-12">
      <PageHeader title="Как это работает" subtitle="Шаги курса, проверка заданий, прогресс и баллы" />

      <section>
        <SectionLabel>Типы шагов</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEP_TYPES.map((t) => (
            <Card key={t.id} className="flex gap-4 p-5">
              <StepTypeIcon type={t} />
              <div>
                <div className="font-bold">{t.label}</div>
                <div className="mt-1 text-sm text-brand-ink-2">{t.description}</div>
                <div className="eyebrow mt-2 text-brand-ink-3">{checkLabels[t.check]}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <span className="flex size-12 items-center justify-center rounded-btn bg-brand-blue-50 text-brand-blue">
            <Icon name="check" size={24} />
          </span>
          <h3 className="mt-4 text-xl font-bold">Автоматическая проверка</h3>
          <p className="mt-2 text-brand-ink-2">Вопросы и задачи с ответом. Результат приходит сразу после отправки.</p>
        </Card>
        <Card className="p-6">
          <span className="flex size-12 items-center justify-center rounded-btn bg-brand-blue-50 text-brand-blue">
            <Icon name="user" size={24} />
          </span>
          <h3 className="mt-4 text-xl font-bold">Ручная проверка</h3>
          <p className="mt-2 text-brand-ink-2">Проекты Scratch, задания в Minecraft, файлы и ссылки уходят куратору. Он принимает работу или возвращает с комментарием — статус и причина видны на шаге и в «Моих работах».</p>
        </Card>
      </section>

      <section>
        <SectionLabel>Статусы шага</SectionLabel>
        <Card>
          <ul>
            {statuses.map((s) => (
              <li key={s.tone} className="flex flex-col gap-2 border-b border-brand-line px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-6">
                <span className="sm:w-48">
                  <StatusPill tone={s.tone} />
                </span>
                <span className="text-brand-ink-2">{s.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <SectionLabel>Частые вопросы</SectionLabel>
        <Card>
          {faq.map((f, i) => (
            <div key={f.q} className="border-b border-brand-line last:border-0">
              <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {f.q}
                <Icon name="chevronDown" size={20} className={cx('shrink-0 text-brand-ink-3 transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && <p className="px-5 pb-5 text-brand-ink-2">{f.a}</p>}
            </div>
          ))}
        </Card>
      </section>

      <div>
        <ButtonLink to="/">На главную</ButtonLink>
      </div>
    </div>
  )
}
