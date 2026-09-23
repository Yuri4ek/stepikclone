import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useUser } from '../../auth/AuthContext'
import { formatPercent, plural } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'
import { ButtonLink, Card, EmptyState, ErrorBox, Loader, PageHeader } from '../../components/ui'
import { QueueRow } from './QueuePage'
import { LagBadge, hoursSince } from './shared'

async function load() {
  const [queue, critical, warning] = await Promise.all([
    api.reviews.queue({ limit: 100 }),
    api.lag.students({ level: 'critical', limit: 5 }),
    api.lag.students({ level: 'warning', limit: 5 }),
  ])
  return { queue, critical, warning }
}

function Stat({ label, value, color, to, hint }: { label: string; value: number; color: string; to: string; hint?: string }) {
  return (
    <Link to={to} className="block">
      <Card className="p-5 transition-shadow hover:shadow-md" accent={color}>
        <div className="text-sm text-content-secondary">{label}</div>
        <div className="mt-1 text-3xl font-medium" style={{ color }}>
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-content-secondary">{hint}</div>}
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
  // Очередь отдаётся в порядке сдачи — первые ждут дольше всех
  const oldest = [...data.queue.items].sort((a, b) => a.submitted_at.localeCompare(b.submitted_at)).slice(0, 5)
  const atRisk = [...data.critical.items, ...data.warning.items].slice(0, 6)

  return (
    <>
      <PageHeader title={`Здравствуйте, ${user.full_name.split(' ')[0]}`} subtitle="Сопровождение учеников: проверка работ и контроль отставания" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ждут проверки" value={data.queue.total} color="#0D9488" to="/curator/queue" />
        <Stat label="Ждут больше суток" value={overdue} color={overdue ? '#EF4444' : '#10B981'} to="/curator/queue" />
        <Stat label="Критичное отставание" value={data.critical.total} color="#EF4444" to="/curator/lag" hint="нет активности 7+ дней" />
        <Stat label="Требуют внимания" value={data.warning.total} color="#D97706" to="/curator/lag" hint="3+ дня или низкий прогресс" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-medium">Дольше всего ждут</h2>
            <ButtonLink to="/curator/queue" variant="ghost">
              Вся очередь →
            </ButtonLink>
          </div>
          {oldest.length ? (
            <Card className="flex flex-col gap-1 p-2">
              {oldest.map((it) => (
                <QueueRow key={it.submission_id} item={it} />
              ))}
            </Card>
          ) : (
            <EmptyState icon="✅" title="Очередь пуста" />
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-medium">Под угрозой отставания</h2>
            <ButtonLink to="/curator/lag" variant="ghost">
              Все →
            </ButtonLink>
          </div>
          {atRisk.length ? (
            <Card className="flex flex-col gap-1 p-2">
              {atRisk.map((it) => (
                <div key={it.enrollment_id} className="flex items-center gap-3 rounded-3xl px-4 py-3 hover:bg-brand/5">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{it.student.full_name}</div>
                    <div className="truncate text-xs text-content-secondary">
                      {it.course_title} · {formatPercent(it.percent)} · {it.days_since_activity}{' '}
                      {plural(it.days_since_activity, 'день', 'дня', 'дней')} без активности
                    </div>
                  </div>
                  <LagBadge level={it.lag_level} />
                </div>
              ))}
            </Card>
          ) : (
            <EmptyState icon="🎉" title="Отстающих нет" />
          )}
        </section>
      </div>
    </>
  )
}
