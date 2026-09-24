import type { Role } from '@/shared/api'

export const roleMeta: Record<Role, { label: string; color: string; cabinet: string; gradient: string }> = {
  student: { label: 'Ученик', color: '#3D5AFE', cabinet: 'Кабинет ученика', gradient: 'linear-gradient(135deg,#3D5AFE,#40C4FF)' },
  curator: { label: 'Куратор', color: '#0EA5E9', cabinet: 'Кабинет куратора', gradient: 'linear-gradient(135deg,#0EA5E9,#7C4DFF)' },
  admin: { label: 'Администратор', color: '#7C3AED', cabinet: 'Кабинет администратора', gradient: 'linear-gradient(135deg,#7C3AED,#C026D3)' },
}
