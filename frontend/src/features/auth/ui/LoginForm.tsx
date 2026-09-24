import { useState, type FormEvent } from 'react'
import { useAuth } from '@/entities/session'
import { RoleBadge } from '@/entities/user'
import { ApiError } from '@/shared/api'
import { Button, ErrorBox, Field, Input } from '@/shared/ui'
import { useAuthSubmit } from '../model/useAuthSubmit'

const DEMO = [
  { email: 'student@example.com', role: 'student' as const },
  { email: 'curator@example.com', role: 'curator' as const },
  { email: 'admin@example.com', role: 'admin' as const },
]

export function LoginForm() {
  const { login } = useAuth()
  const { error, busy, run } = useAuthSubmit()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void run(() => login(email.trim(), password))
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Email">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Пароль">
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <ErrorBox error={error instanceof ApiError && error.status === 401 ? 'Неверный email или пароль' : error} />}
        <Button type="submit" loading={busy} className="w-full py-3">
          Войти
        </Button>
      </form>

      <div className="mt-8">
        <div className="mb-3 text-sm font-medium text-content-secondary">Демо-доступ · пароль demo1234</div>
        <div className="grid gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              disabled={busy}
              onClick={() => void run(() => login(d.email, 'demo1234'))}
              className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-transform hover:-translate-y-0.5"
            >
              <span>{d.email}</span>
              <RoleBadge role={d.role} />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
