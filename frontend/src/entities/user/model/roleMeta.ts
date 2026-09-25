import type { Role } from '@/shared/api'

export const roleMeta: Record<Role, { label: string; cabinet: string }> = {
  student: { label: 'Ученик', cabinet: 'Кабинет ученика' },
  curator: { label: 'Куратор', cabinet: 'Кабинет куратора' },
  admin: { label: 'Администратор', cabinet: 'Кабинет администратора' },
}
