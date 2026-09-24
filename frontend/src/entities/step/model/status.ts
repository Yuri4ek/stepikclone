import type { StepStatus } from '@/shared/api'

export const stepStatusMeta: Record<StepStatus, { label: string; color: string; icon: string }> = {
  locked: { label: 'Закрыт', color: '#94A3B8', icon: '🔒' },
  available: { label: 'Доступен', color: '#3D5AFE', icon: '•' },
  in_progress: { label: 'В процессе', color: '#3D5AFE', icon: '…' },
  submitted: { label: 'На проверке', color: '#D97706', icon: '⏳' },
  returned: { label: 'Возвращено', color: '#EF4444', icon: '↩' },
  passed: { label: 'Пройден', color: '#059669', icon: '✓' },
  failed: { label: 'Не засчитан', color: '#EF4444', icon: '✕' },
}
