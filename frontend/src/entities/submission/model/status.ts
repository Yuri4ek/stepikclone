import type { SubmissionStatus } from '@/shared/api'

/** Статус работы глазами ученика */
export const submissionStatusMeta: Record<SubmissionStatus, { label: string; color: string }> = {
  pending: { label: 'На проверке', color: '#D97706' },
  graded: { label: 'Проверено', color: '#059669' },
  returned: { label: 'Возвращено', color: '#EF4444' },
}

/** Статус работы глазами куратора */
export const reviewStatusMeta: Record<SubmissionStatus, { label: string; color: string }> = {
  pending: { label: 'Ждёт проверки', color: '#D97706' },
  graded: { label: 'Принято', color: '#10B981' },
  returned: { label: 'Возвращено', color: '#EF4444' },
}
