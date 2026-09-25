import type { StepStatus } from '@/shared/api'
import { statusTone, type StatusTone } from '@/shared/ui'


export const stepTone: Record<StepStatus, StatusTone> = {
  passed: 'done',
  submitted: 'review',
  returned: 'returned',
  failed: 'failed',
  available: 'progress',
  in_progress: 'progress',
  locked: 'idle',
}

export const stepStatusMeta = (s: StepStatus) => statusTone[stepTone[s]]
