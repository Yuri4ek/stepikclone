import { api, type LagLevel, type Role } from '../../api'
import { useAsync } from '../../lib/useAsync'
import { Badge, Button, Select } from '../../components/ui'

/** Курсы для фильтров: админ видит все (в т.ч. черновики), куратор — опубликованные */
export function useCourseOptions(role: Role) {
  return useAsync(async () => {
    if (role === 'admin') return (await api.admin.courses()).map((c) => ({ id: c.id, title: c.title }))
    return (await api.catalog.courses()).items.map((c) => ({ id: c.id, title: c.title }))
  }, [role])
}

export function CourseFilter({ role, value, onChange }: { role: Role; value: string; onChange: (v: string) => void }) {
  const { data } = useCourseOptions(role)
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="w-auto min-w-56" aria-label="Курс">
      <option value="">Все курсы</option>
      {data?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </Select>
  )
}

export const lagMeta: Record<LagLevel, { label: string; color: string; icon: string }> = {
  critical: { label: 'Критично', color: '#EF4444', icon: '🔴' },
  warning: { label: 'Внимание', color: '#D97706', icon: '🟠' },
}

export function LagBadge({ level }: { level: LagLevel }) {
  return (
    <Badge color={lagMeta[level].color}>
      {lagMeta[level].icon} {lagMeta[level].label}
    </Badge>
  )
}

export function Pager({ total, limit, offset, onChange }: { total: number; limit: number; offset: number; onChange: (offset: number) => void }) {
  if (total <= limit) return null
  const page = Math.floor(offset / limit) + 1
  const pages = Math.ceil(total / limit)
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
        ←
      </Button>
      <span>
        {page} из {pages}
      </span>
      <Button size="sm" variant="secondary" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>
        →
      </Button>
    </div>
  )
}

export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 36e5
}

export function waitLabel(iso: string): string {
  const h = hoursSince(iso)
  if (h < 1) return 'меньше часа'
  if (h < 24) return `${Math.floor(h)} ч`
  return `${Math.floor(h / 24)} д`
}
