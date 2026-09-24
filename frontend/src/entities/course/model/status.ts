import type { CourseStatus } from '@/shared/api'

export const courseStatusMeta: Record<CourseStatus, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: '#64748B' },
  published: { label: 'Опубликован', color: '#10B981' },
}
