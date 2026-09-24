import type { StepStatus } from '@/shared/api'
import { Badge } from '@/shared/ui'
import { stepStatusMeta } from '../model/status'

export function StatusBadge({ status }: { status: StepStatus }) {
  const m = stepStatusMeta[status]
  return <Badge color={m.color}>{m.label}</Badge>
}
