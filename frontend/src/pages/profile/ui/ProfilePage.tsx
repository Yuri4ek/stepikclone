import { Link } from 'react-router-dom'
import { courseApi } from '@/entities/course'
import { useAuth, useUser } from '@/entities/session'
import { Avatar, RoleBadge } from '@/entities/user'
import { formatDate, formatPercent, formatScore, plural, useAsync } from '@/shared/lib'
import { Button, ButtonLink, Card, EmptyState, Icon, List, Loader, ProgressBar, SectionLabel, type IconName } from '@/shared/ui'

function StudentStats() {
  const { data, loading } = useAsync(() => courseApi.catalog(), [])
  if (loading && !data) return <Loader />
  const mine = data?.items.filter((c) => c.enrollment) ?? []
  const avgPercent = mine.length ? mine.reduce((a, c) => a + c.enrollment!.percent, 0) / mine.length : 0
  const finished = mine.filter((c) => c.enrollment!.percent >= 100).length

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="text-brand-ink-2">Курсов</div>
          <div className="num mt-1 text-4xl font-extrabold">{mine.length}</div>
          <div className="text-sm text-brand-ink-3">
            <span className="num">{finished}</span> {plural(finished, 'пройден', 'пройдено', 'пройдено')} полностью
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-brand-ink-2">Средний прогресс</div>
          <div className="num mt-1 text-4xl font-extrabold">{formatPercent(avgPercent)}</div>
          <ProgressBar value={avgPercent} className="mt-3" />
        </Card>
      </div>

      <div>
        <SectionLabel>Мои курсы</SectionLabel>
        {mine.length === 0 ? (
          <EmptyState icon="grid" title="Курсов пока нет">
            <Link to="/catalog" className="font-semibold text-brand-blue">
              Выбрать курс
            </Link>
          </EmptyState>
        ) : (
          <Card>
            <List>
              {mine.map((c) => (
                <Link key={c.id} to={`/courses/${c.id}/progress`} className="flex items-center gap-4 rounded-btn p-4 hover:bg-brand-mist">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{c.title}</div>
                    <ProgressBar value={c.enrollment!.percent} className="mt-2 max-w-md" />
                  </div>
                  <span className="num font-semibold">{formatPercent(c.enrollment!.percent)}</span>
                  <span className="num hidden text-sm text-brand-ink-3 sm:inline">рейтинг {formatScore(c.enrollment!.rating_score)} из 100</span>
                  <Icon name="chevronRight" size={18} className="text-brand-ink-3" />
                </Link>
              ))}
            </List>
          </Card>
        )}
      </div>
    </div>
  )
}

const staffLinks: Record<'curator' | 'admin', { to: string; title: string; text: string; icon: IconName }[]> = {
  curator: [
    { to: '/curator/queue', title: 'Очередь проверки', text: 'Работы, которые ждут вашей оценки', icon: 'inbox' },
    { to: '/curator/lag', title: 'Ученики', text: 'Кто замедлился или выпадает', icon: 'users' },
    { to: '/catalog', title: 'Курсы', text: 'Программы, которые вы сопровождаете', icon: 'grid' },
  ],
  admin: [
    { to: '/admin', title: 'Курсы', text: 'Создание, сборка и публикация', icon: 'layers' },
    { to: '/admin/users', title: 'Пользователи', text: 'Ученики, кураторы, назначения', icon: 'users' },
    { to: '/curator/queue', title: 'Очередь проверки', text: 'Все работы на ручной проверке', icon: 'inbox' },
  ],
}

export function ProfilePage() {
  const user = useUser()
  const { logout } = useAuth()

  return (
    <div className="space-y-8">
      <Card className="flex flex-wrap items-center gap-5 p-6 sm:p-8">
        <Avatar name={user.full_name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">{user.full_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-ink-2">
            <RoleBadge role={user.role} />
            <span>{user.email}</span>
            {user.last_seen_at && <span>· последний вход {formatDate(user.last_seen_at)}</span>}
          </div>
        </div>
        <Button variant="secondary" onClick={logout}>
          <Icon name="logout" size={18} />
          Выйти
        </Button>
      </Card>

      {user.role === 'student' ? (
        <StudentStats />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {staffLinks[user.role].map((l) => (
            <Link key={l.to} to={l.to}>
              <Card className="h-full p-6 transition-colors hover:border-brand-blue-200">
                <span className="flex size-12 items-center justify-center rounded-btn bg-brand-blue-50 text-brand-blue">
                  <Icon name={l.icon} size={24} />
                </span>
                <div className="mt-4 font-bold">{l.title}</div>
                <div className="mt-1 text-sm text-brand-ink-2">{l.text}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {user.role === 'student' && (
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/history" variant="secondary">
            Мои работы
          </ButtonLink>
          <ButtonLink to="/help" variant="ghost">
            Как считаются баллы
          </ButtonLink>
        </div>
      )}
    </div>
  )
}
