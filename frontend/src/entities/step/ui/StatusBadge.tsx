import type { StepStatus } from '@/shared/api'
import { StatusPill } from '@/shared/ui'
import { stepTone } from '../model/status'

export function StatusBadge({ status, checkedBy }: { status: StepStatus; checkedBy?: 'manual' | 'auto' | null }) {
  return <StatusPill tone={stepTone[status]} checkedBy={status === 'passed' ? checkedBy : null} />
}
