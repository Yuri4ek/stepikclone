import type { LagLevel } from '@/shared/api'

export const lagMeta: Record<LagLevel, { label: string; color: string; icon: string }> = {
  critical: { label: 'Критично', color: '#EF4444', icon: '🔴' },
  warning: { label: 'Внимание', color: '#D97706', icon: '🟠' },
}
