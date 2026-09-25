import { Dot } from '@/shared/ui'
import { lagMeta, type LagState } from '../model/lagMeta'

export function LagBadge({ level }: { level: LagState }) {
  return <Dot className={lagMeta[level].cls}>{lagMeta[level].label}</Dot>
}
