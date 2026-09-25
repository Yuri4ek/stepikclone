import type { StatusTone } from '@/shared/ui'
import type { SubmissionStatus } from '@/shared/api'

/** Статус работы → тон брендбука. Автопроверка с 0 баллов — «Не прошло тесты» */
export function submissionTone(s: { status: SubmissionStatus; check_type?: 'auto' | 'manual'; score?: number | null }): StatusTone {
  if (s.status === 'pending') return 'review'
  if (s.status === 'returned') return 'returned'
  if (s.check_type === 'auto' && s.score === 0) return 'failed'
  return 'done'
}
