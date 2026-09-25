import { useState } from 'react'
import { useAuth } from '@/entities/session'
import { ApiError } from '@/shared/api'
import { Button, ErrorBox, Field, Input } from '@/shared/ui'
import { useAuthSubmit } from '../model/useAuthSubmit'

export function RegisterForm() {
  const { register } = useAuth()
  const { error, busy, run } = useAuthSubmit()
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void run(() => register(form.email.trim(), form.password, form.full_name.trim()))
      }}
      className="mt-6 space-y-4"
    >
      <Field label="Имя и фамилия">
        <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </Field>
      <Field label="Email">
        <Input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <Field label="Пароль" hint="Не короче 6 символов">
        <Input type="password" autoComplete="new-password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </Field>
      {error && <ErrorBox error={error instanceof ApiError && error.status === 409 ? 'Такой email уже зарегистрирован' : error} />}
      <Button type="submit" loading={busy} className="w-full">
        Создать аккаунт
      </Button>
      <p className="text-xs text-brand-ink-3">На стенде используй только вымышленные имя и почту — это демонстрационная версия.</p>
    </form>
  )
}
