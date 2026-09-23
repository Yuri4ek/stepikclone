import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth, useUser } from '../auth/AuthContext'
import { formatDate, formatPercent, plural } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import { Avatar, Button, ButtonLink, Card, EmptyState, List, Loader, ProgressBar, RoleBadge, ScorePill, roleMeta } from '../components/ui'

function StudentStats() {
  const { data, loading } = useAsync(() => api.catalog.courses(), [])
  if (loading && !data) return <Loader />
  const mine = data?.items.filter((c) => c.enrollment) ?? []
  const avgPercent = mine.length ? mine.reduce((a, c) => a + c.enrollment!.percent, 0) / mine.length : 0
  const bestRating = mine.reduce((a, c) => Math.max(a, c.enrollment!.rating_score), 0)
  const finished = mine.filter((c) => c.enrollment!.percent >= 100).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6" accent="#3D5AFE">
          <div className="text-sm text-content-secondary">Курсов</div>
          <div className="mt-1 text-4xl font-medium">{mine.length}</div>
          <div className="text-xs text-content-secondary">
            {finished} {plural(finished, 'пройден', 'пройдено', 'пройдено')} полностью
          </div>
        </Card>
        <Card className="p-6" accent="#7C4DFF">
          <div className="text-sm text-content-secondary">Средний прогресс</div>
          <div className="mt-1 text-4xl font-medium">{formatPercent(avgPercent)}</div>
          <ProgressBar value={avgPercent} className="mt-3" />
        </Card>
        <Card className="p-6" accent="#F59E0B">
          <div className="text-sm text-amber-700">Лучший рейтинг</div>
          <div className="mt-1 text-4xl font-medium text-amber-500">★ {Math.round(bestRating)}</div>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-medium">Мои курсы</h2>
        {mine.length === 0 ? (
          <EmptyState icon="🚀" title="Вы пока не записаны на курсы">
            <Link to="/catalog" className="text-brand">
              Перейти в каталог
            </Link>
          </EmptyState>
        ) : (
          <Card>
            <List>
              {mine.map((c) => (
                <Link key={c.id} to={`/courses/${c.id}/progress`} className="flex items-center gap-4 rounded-3xl p-4 hover:bg-brand/5">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{c.title}</div>
                    <ProgressBar value={c.enrollment!.percent} className="mt-2 max-w-md" />
                  </div>
                  <span className="text-sm font-medium">{formatPercent(c.enrollment!.percent)}</span>
                  <ScorePill>{Math.round(c.enrollment!.rating_score)}</ScorePill>
                </Link>
              ))}
            </List>
          </Card>
        )}
      </div>
    </div>
  )
}

const staffLinks = {
  curator: [
    { to: '/curator/queue', title: 'Очередь проверки', text: 'Работы, которые ждут вашей оценки', icon: '📥' },
    { to: '/curator/lag', title: 'Отстающие', text: 'Кому стоит написать в первую очередь', icon: '⏰' },
    { to: '/catalog', title: 'Курсы', text: 'Программы, которые вы сопровождаете', icon: '📚' },
  ],
  admin: [
    { to: '/admin', title: 'Конструктор курсов', text: 'Создание, сборка и публикация', icon: '🧱' },
    { to: '/curator/queue', title: 'Проверка работ', text: 'Все работы на ручной проверке', icon: '📥' },
    { to: '/curator/lag', title: 'Отстающие', text: 'Ученики под угрозой отставания', icon: '⏰' },
  ],
}

export function ProfilePage() {
  const user = useUser()
  const { logout } = useAuth()
  const role = roleMeta[user.role]

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="h-28 sm:h-36" style={{ backgroundImage: role.gradient }} />
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6 sm:px-8">
          <span className="-mt-10 rounded-full ring-4 ring-white">
            <Avatar name={user.full_name} role={user.role} size="lg" />
          </span>
          <div className="min-w-0 flex-1 pt-4">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">{user.full_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-content-secondary">
              <RoleBadge role={user.role} />
              <span>{user.email}</span>
              <span>· последний вход {formatDate(user.last_seen_at)}</span>
            </div>
          </div>
          <Button variant="danger" onClick={logout}>
            Выйти из аккаунта
          </Button>
        </div>
      </Card>

      {user.role === 'student' ? (
        <StudentStats />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {staffLinks[user.role].map((l) => (
            <Link key={l.to} to={l.to}>
              <Card className="h-full p-6 transition-transform hover:-translate-y-1" accent={role.color}>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/70 text-2xl">{l.icon}</div>
                <div className="mt-4 font-medium">{l.title}</div>
                <div className="mt-1 text-sm text-content-secondary">{l.text}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {user.role === 'student' && (
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/history" variant="secondary">
            История работ
          </ButtonLink>
          <ButtonLink to="/help" variant="ghost">
            Как считается рейтинг
          </ButtonLink>
        </div>
      )}
    </div>
  )
}
