import { useState } from 'react'
import { LagBadge, lagApi } from '@/entities/lag'
import { Avatar, userApi } from '@/entities/user'
import { AssignToCourse } from '@/features/manage-course'
import type { LagLevel, Role } from '@/shared/api'
import { useAsync } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Loader, Notice, PageHeader, Segmented } from '@/shared/ui'

const tabs: { value: Role; label: string }[] = [
  { value: 'student', label: 'Ученики' },
  { value: 'curator', label: 'Кураторы' },
  { value: 'admin', label: 'Администраторы' },
]

async function load(role: Role) {
  const [users, lag] = await Promise.all([userApi.list(role), role === 'student' ? lagApi.students({ limit: 100 }) : Promise.resolve(null)])
  // Худший уровень отставания по всем курсам ученика
  const worst = new Map<string, LagLevel>()
  for (const it of lag?.items ?? []) {
    if (worst.get(it.student.id) !== 'critical') worst.set(it.student.id, it.lag_level)
  }
  return { users, worst }
}

export function AdminUsersPage() {
  const [role, setRole] = useState<Role>('student')
  const { data, error, loading, reload } = useAsync(() => load(role), [role])

  return (
    <>
      <PageHeader title="Пользователи" subtitle="Ученики, кураторы и администраторы платформы" actions={<Segmented value={role} onChange={setRole} options={tabs} />} />

      {role === 'curator' && <Notice className="mb-4">Назначьте куратора на курс — он увидит работы и отставание учеников этого курса.</Notice>}

      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (data.users.length === 0 ? (
          <EmptyState icon="users" title="Пользователей с этой ролью нет" />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="border-b border-brand-line bg-brand-mist text-left">
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">Имя</th>
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">Email</th>
                  <th className="eyebrow px-4 py-3 text-brand-ink-3">{role === 'student' ? 'Отставание' : role === 'curator' ? 'Назначить на курс' : ''}</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b border-brand-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name} size="sm" />
                        <span className="font-semibold">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-ink-2">{u.email}</td>
                    <td className="px-4 py-3">
                      {role === 'student' && <LagBadge level={data.worst.get(u.id) ?? 'ok'} />}
                      {role === 'curator' && <AssignToCourse curatorId={u.id} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
    </>
  )
}
