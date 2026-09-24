import type { Role } from '@/shared/api'
import { Select } from '@/shared/ui'
import { useCourseOptions } from '../model/useCourseOptions'

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
