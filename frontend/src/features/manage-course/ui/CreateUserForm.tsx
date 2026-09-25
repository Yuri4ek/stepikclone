import { useState } from 'react'
import type { AdminUser, Role } from '@/shared/api'
import { Button, Card, ErrorBox, Field, Input, Select } from '@/shared/ui'
import { manageCourseApi } from '../api/manageCourseApi'


export function CreateUserForm({ role, onCreated, onCancel }: { role: Role; onCreated: (u: AdminUser) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()
  return (
    <Card className="mb-4 p-5">
      <form
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError(undefined)
          try {
            onCreated(await manageCourseApi.createUser(form))
          } catch (err) {
            setError(err as Error)
          } finally {
            setBusy(false)
          }
        }}
      >
        <Field label="Имя и фамилия">
          <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Пароль" hint="Не короче 6 символов">
          <Input required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Field label="Роль">
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="student">Ученик</option>
            <option value="curator">Куратор</option>
            <option value="admin">Администратор</option>
          </Select>
        </Field>
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>
            Создать
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </form>
      {error && (
        <div className="mt-3">
          <ErrorBox error={error} />
        </div>
      )}
    </Card>
  )
}
