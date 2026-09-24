import type { LagLevel } from '@/shared/api'
import { Badge } from '@/shared/ui'
import { lagMeta } from '../model/lagMeta'

export function LagBadge({ level }: { level: LagLevel }) {
  return (
    <Badge color={lagMeta[level].color}>
      {lagMeta[level].icon} {lagMeta[level].label}
    </Badge>
  )
}
