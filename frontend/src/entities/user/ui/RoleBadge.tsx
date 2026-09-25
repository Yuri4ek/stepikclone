import type { Role } from '@/shared/api'
import { Badge } from '@/shared/ui'
import { roleMeta } from '../model/roleMeta'

export function RoleBadge({ role }: { role: Role }) {
  return <Badge className="bg-brand-blue-50 text-brand-blue">{roleMeta[role].label}</Badge>
}
