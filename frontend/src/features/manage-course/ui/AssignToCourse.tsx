import { useState } from 'react'
import { courseApi } from '@/entities/course'
import { useAsync } from '@/shared/lib'
import { Button, Icon, Select } from '@/shared/ui'
import { manageCourseApi } from '../api/manageCourseApi'


export function AssignToCourse({ userId, role, exclude = [], onDone }: { userId: string; role: 'curator' | 'student'; exclude?: string[]; onDone?: () => void }) {
  const courses = useAsync(() => courseApi.adminList(), [])
  const [courseId, setCourseId] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
          if (role === 'curator') await manageCourseApi.assignCurator(courseId, userId)
          else await manageCourseApi.enrollStudent(courseId, userId)
          setDone(courses.data?.find((c) => c.id === courseId)?.title ?? 'курс')
          setCourseId('')
          onDone?.()
        } catch (err) {
          setError((err as Error).message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <Select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-56 py-1.5" aria-label="Курс">
        <option value="">{courses.loading ? 'Загрузка…' : 'Выберите курс'}</option>
        {courses.data?.filter((c) => !exclude.includes(c.id)).map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" variant="secondary" loading={busy} disabled={!courseId}>
        {role === 'curator' ? 'Назначить' : 'Записать'}
      </Button>
      {done && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-st-done">
          <Icon name="check" size={14} strokeWidth={2.4} />
          {role === 'curator' ? 'Назначен' : 'Записан'} на «{done}»
        </span>
      )}
      {error && <span className="text-xs text-brand-amber-text">{error}</span>}
    </form>
  )
}
