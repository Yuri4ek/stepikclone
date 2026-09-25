import { Link } from 'react-router-dom'
import { LagBadge, lagApi, lagSentence } from '@/entities/lag'
import { questionApi } from '@/entities/question'
import { useUser } from '@/entities/session'
import { StepTypeIcon, resolveStepType } from '@/entities/step'
import { QueueTable, submissionApi } from '@/entities/submission'
import { cx, formatPercent, hoursSince, useAsync } from '@/shared/lib'
import { ButtonLink, Card, EmptyState, ErrorBox, Icon, Loader, PageHeader, SectionLabel, type IconName } from '@/shared/ui'

async function load() {
  const [queue, lag, questions] = await Promise.all([submissionApi.queue({ limit: 100 }), lagApi.students({ limit: 100 }), questionApi.inbox({ status: 'open' })])
  return { queue, lag, questions }
}

/** Ключ «ученик + курс» — чтобы показать уровень отставания рядом с работой в очереди */
const lagKey = (studentId: string, courseId: string) => `${studentId}:${courseId}`

function Stat({ label, value, to, hint, icon, attention }: { label: string; value: number; to: string; hint: string; icon: IconName; attention?: boolean }) {
  return (
    <Link to={to} className="block">
      <Card className="h-full p-5 transition-colors hover:border-brand-blue-200">
        <div className="flex items-center justify-between text-sm text-brand-ink-2">
          {label}
          <Icon name={icon} size={18} className="text-brand-ink-3" />
        </div>
        <div className={cx('num mt-1 text-[32px] leading-tight font-extrabold', attention && value > 0 && 'text-brand-amber-text')}>{value}</div>
        <div className="text-xs text-brand-ink-3">{hint}</div>
      </Card>
    </Link>
  )
}

export function OverviewPage() {
  const user = useUser()
  const { data, error, loading, reload } = useAsync(load, [])

  if (loading && !data) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!data) return null

  const overdue = data.queue.items.filter((i) => hoursSince(i.submitted_at) > 24).length
  const critical = data.lag.items.filter((i) => i.lag_level === 'critical')
  const warning = data.lag.items.filter((i) => i.lag_level === 'warning')
  const lagMap = new Map(data.lag.items.map((i) => [lagKey(i.student.id, i.course_id), i.lag_level]))
  const atRisk = [...critical, ...warning].slice(0, 6)

  return (
    <>
      <PageHeader title={`Здравствуйте, ${user.full_name.split(' ')[0]}`} subtitle="Работы на проверку и ученики, которым сейчас нужно внимание" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Ждут проверки" value={data.queue.total} to="/curator/queue" hint="в очереди ручной проверки" icon="inbox" />
        <Stat label="Ждут больше суток" value={overdue} to="/curator/queue" hint="стоит проверить первыми" icon="clock" attention />
        <Stat label="Вопросы без ответа" value={data.questions.open} to="/curator/questions" hint="ученики спрашивают по шагам" icon="message" attention />
        <Stat label="Выпадают" value={critical.length} to="/curator/lag" hint="давно не заходят или не продвигаются" icon="alert" attention />
        <Stat label="Замедлились" value={warning.length} to="/curator/lag" hint="ранние сигналы: застрял, не продвигается" icon="users" attention />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel className="mb-0">Дольше всего ждут</SectionLabel>
            <ButtonLink to="/curator/queue" variant="ghost" size="sm">
              Вся очередь
              <Icon name="arrowRight" size={16} />
            </ButtonLink>
          </div>
          {data.queue.items.length ? (
            <Card className="overflow-hidden">
              <QueueTable stepIcon={(it) => <StepTypeIcon type={resolveStepType('task', it.step_type)} size="sm" />} items={data.queue.items.slice(0, 5)} studentMeta={(it) => <LagBadge level={lagMap.get(lagKey(it.student.id, it.course_id)) ?? 'ok'} />} />
            </Card>
          ) : (
            <EmptyState icon="check" title="Очередь пуста. Все работы проверены." />
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel className="mb-0">Нужно написать</SectionLabel>
            <ButtonLink to="/curator/lag" variant="ghost" size="sm">
              Все ученики
              <Icon name="arrowRight" size={16} />
            </ButtonLink>
          </div>
          {atRisk.length ? (
            <Card className="divide-y divide-brand-line">
              {atRisk.map((it) => (
                <div key={it.enrollment_id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{it.student.full_name}</span>
                    <LagBadge level={it.lag_level} />
                  </div>
                  <div className="mt-0.5 text-sm text-brand-ink-2">{lagSentence(it)}.</div>
                  <div className="num text-xs text-brand-ink-3">
                    {it.course_title} · пройдено {formatPercent(it.percent)}
                  </div>
                </div>
              ))}
            </Card>
          ) : (
            <EmptyState icon="users" title="Все ученики в графике" />
          )}
        </section>
      </div>
    </>
  )
}
