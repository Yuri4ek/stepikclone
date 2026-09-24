import type { Role } from '@/shared/api'
import { roleMeta } from '../model/roleMeta'

export function RoleBadge({ role }: { role: Role }) {
  const m = roleMeta[role]
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundImage: m.gradient }}>
      {m.label}
    </span>
  )
}
