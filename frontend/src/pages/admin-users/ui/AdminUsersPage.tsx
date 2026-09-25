import { useState } from 'react'
import { LagBadge, lagApi } from '@/entities/lag'
import { Avatar, userApi } from '@/entities/user'
import { AssignToCourse, CreateUserForm } from '@/features/manage-course'
import type { LagLevel, Role } from '@/shared/api'
import { relativeDay, useAsync } from '@/shared/lib'
import { Button, Card, EmptyState, ErrorBox, Icon, Loader, Notice, PageHeader, Segmented } from '@/shared/ui'

const tabs: { value: Role; label: string }[] = [
  { value: 'student', label: 'Ученики' },
  { value: 'curator', label: 'Кураторы' },
  { value: 'admin', label: 'Администраторы' },
]

const rank: Record<LagLevel, number> = { ok: 0, warning: 1, critical: 2 }

async function load(role: Role) {
  const [users, lag] = await Promise.all([userApi.list(role), role === 'student' ? lagApi.students({ include_ok: true, limit: 500 }) : Promise.resolve(null)])
  // Худший уровень отставания по всем курсам ученика
  const worst = new Map<string, LagLevel>()
  for (const it of lag?.items ?? []) {
    const prev = worst.get(it.student.id)
    if (!prev || rank[it.lag_level] > rank[prev]) worst.set(it.student.id, it.lag_level)
  }
  return { users, worst }
}

export function AdminUsersPage() {
  const [role, setRole] = useState<Role>('student')
  const [creating, setCreating] = useState(false)
  const { data, error, loading, reload } = useAsync(() => load(role), [role])

  return (
    <>
      <PageHeader
        title="Пользователи"
        subtitle="Ученики, кураторы и администраторы платформы"
        actions={
          <div className="flex flex-wrap gap-2">
            <Segmented value={role} onChange={setRole} options={tabs} />
            <Button size="sm" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} />
              Пользователь
            </Button>
          </div>
        }
      />

      {creating && (
        <CreateUserForm
          role={role}
          onCancel={() => setCreating(false)}
          onCreated={(u) => {
            setCreating(false)
            if (u.role === role) void reload()
            else setRole(u.role)
          }}
        />
      )}

      {role === 'curator' && <Notice className="mb-4">Назначьте куратора на курс — он увидит работы, вопросы и отставание учеников этого курса.</Notice>}

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (data.users.length === 0 ? (
          <EmptyState icon="users" title="Пользователей с этой ролью нет" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-brand-line bg-brand-mist text-left">
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">Имя</th>
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">{role === 'curator' ? 'Курсы куратора' : role === 'student' ? 'Курсы' : 'Последний вход'}</th>
                  {role !== 'admin' && <th className="eyebrow px-4 py-3 text-brand-ink-3">{role === 'student' ? 'Записать на курс' : 'Назначить на курс'}</th>}
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b border-brand-line align-top last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name} size="sm" />
                        <div>
                          <div className="font-semibold">{u.full_name}</div>
                          <div className="text-xs text-brand-ink-3">{u.email}</div>
                          {role === 'student' && <LagBadge level={data.worst.get(u.id) ?? 'ok'} />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {role === 'admin' ? (
                        <span className="text-brand-ink-2">{relativeDay(u.last_seen_at) || '—'}</span>
                      ) : u.courses.length ? (
                        <ul className="space-y-0.5">
                          {u.courses.map((c) => (
                            <li key={c.id}>{c.title}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-brand-ink-3">{role === 'curator' ? 'Не назначен' : 'Не записан'}</span>
                      )}
                    </td>
                    {role !== 'admin' && (
                      <td className="px-4 py-3">
                        <AssignToCourse userId={u.id} role={role === 'curator' ? 'curator' : 'student'} exclude={u.courses.map((c) => c.id)} onDone={() => void reload()} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
    </>
  )
}
