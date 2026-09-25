import { useState } from 'react'
import { Avatar } from '@/entities/user'
import { formatPercent, useAsync } from '@/shared/lib'
import { Button, Card, ErrorBox, Icon, Select } from '@/shared/ui'
import { manageCourseApi } from '../api/manageCourseApi'


export function CoursePeople({ courseId }: { courseId: string }) {
  const people = useAsync(() => manageCourseApi.people(courseId), [courseId])
  const curators = useAsync(() => manageCourseApi.users('curator'), [])
  const students = useAsync(() => manageCourseApi.users('student'), [])
  const [pick, setPick] = useState({ curator: '', student: '' })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<Error>()

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key)
    setError(undefined)
    try {
      await fn()
      await people.reload()
    } catch (e) {
      setError(e as Error)
    } finally {
      setBusy(null)
    }
  }

  const p = people.data
  const freeCurators = (curators.data ?? []).filter((u) => !p?.curators.some((c) => c.id === u.id))
  const freeStudents = (students.data ?? []).filter((u) => !p?.students.some((s) => s.id === u.id))

  return (
    <Card className="space-y-6 p-5">
      <div>
        <h2 className="font-bold">Кураторы курса</h2>
        <p className="mt-1 text-sm text-brand-ink-2">Куратор видит работы, вопросы и отставание учеников этого курса.</p>
        <ul className="mt-3 space-y-1">
          {p?.curators.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-btn px-2 py-1.5 hover:bg-brand-mist">
              <Avatar name={c.full_name} size="sm" />
              <span className="flex-1">
                <span className="block font-semibold">{c.full_name}</span>
                <span className="text-xs text-brand-ink-3">{c.email}</span>
              </span>
              <Button size="sm" variant="ghost" loading={busy === `c-${c.id}`} onClick={() => confirm(`Снять ${c.full_name} с курса?`) && void run(`c-${c.id}`, () => manageCourseApi.unassignCurator(courseId, c.id))}>
                Снять
              </Button>
            </li>
          ))}
          {p && p.curators.length === 0 && <li className="text-sm text-brand-amber-text">Куратор не назначен — работы учеников некому проверять.</li>}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void run('curator', () => manageCourseApi.assignCurator(courseId, pick.curator)).then(() => setPick({ ...pick, curator: '' }))
          }}
        >
          <Select required value={pick.curator} onChange={(e) => setPick({ ...pick, curator: e.target.value })} aria-label="Куратор">
            <option value="">{curators.loading ? 'Загрузка…' : 'Выберите куратора'}</option>
            {freeCurators.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} · {u.email}
              </option>
            ))}
          </Select>
          <Button type="submit" loading={busy === 'curator'} disabled={!pick.curator}>
            Назначить
          </Button>
        </form>
      </div>

      <div className="border-t border-brand-line pt-5">
        <h2 className="font-bold">Ученики курса {p && <span className="num font-normal text-brand-ink-3">· {p.students.length}</span>}</h2>
        <p className="mt-1 text-sm text-brand-ink-2">Ученики могут записаться сами из каталога или вы запишете их здесь.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void run('student', () => manageCourseApi.enrollStudent(courseId, pick.student)).then(() => setPick({ ...pick, student: '' }))
          }}
        >
          <Select required value={pick.student} onChange={(e) => setPick({ ...pick, student: e.target.value })} aria-label="Ученик">
            <option value="">{students.loading ? 'Загрузка…' : 'Выберите ученика'}</option>
            {freeStudents.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} · {u.email}
              </option>
            ))}
          </Select>
          <Button type="submit" loading={busy === 'student'} disabled={!pick.student}>
            Записать
          </Button>
        </form>
        <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
          {p?.students.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-btn px-2 py-1.5 hover:bg-brand-mist">
              <Avatar name={s.full_name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{s.full_name}</span>
                <span className="num text-xs text-brand-ink-3">пройдено {formatPercent(s.percent)}</span>
              </span>
              <button
                className="p-2 text-brand-ink-3 hover:text-st-failed"
                title="Отчислить с курса"
                aria-label={`Отчислить ${s.full_name}`}
                onClick={() => confirm(`Отчислить ${s.full_name} с курса? Прогресс сохранится, если записать снова.`) && void run(`s-${s.id}`, () => manageCourseApi.unenrollStudent(courseId, s.id))}
              >
                <Icon name="x" size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
      {(error || people.error) && <ErrorBox error={(error ?? people.error)!} />}
    </Card>
  )
}
