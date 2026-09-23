import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Layout'
import { Button, ErrorBox, Field, Input, RoleBadge } from '../components/ui'
import { STEP_TYPES } from '../steps/registry'

const DEMO = [
  { email: 'student@example.com', role: 'student' as const },
  { email: 'curator@example.com', role: 'curator' as const },
  { email: 'admin@example.com', role: 'admin' as const },
]

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen gap-4 p-3 sm:p-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-3 py-4 sm:px-8">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <aside className="bg-brand-gradient relative hidden flex-col justify-between overflow-hidden rounded-[36px] p-12 text-white lg:flex">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-brand-sky/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-fuchsia-400/40 blur-3xl" aria-hidden />
        <div className="relative">
          <div className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur">С 2027 года — базовый вид спорта в Чувашии</div>
          <h2 className="mt-8 text-5xl leading-[1.1] font-medium tracking-tight">Учись программировать шаг за шагом</h2>
          <p className="mt-5 max-w-md text-lg text-white/80">
            Проходи курс в своём темпе, получай результат проверки сразу, а куратор поможет там, где нужна живая обратная связь.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-3">
          {STEP_TYPES.filter((t) => ['theory', 'algo', 'scratch', 'minecraft'].includes(t.id)).map((t) => (
            <div key={t.id} className="rounded-3xl bg-white/12 p-5 backdrop-blur-md">
              <div className="flex size-11 items-center justify-center rounded-2xl text-2xl" style={{ backgroundColor: `${t.color}55` }}>
                {t.icon}
              </div>
              <div className="mt-3 font-medium">{t.label}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

function useAuthSubmit() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<Error>()
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      navigate(from, { replace: true })
    } catch (e) {
      setError(e as Error)
    } finally {
      setBusy(false)
    }
  }
  return { error, busy, run }
}

export function LoginPage() {
  const { login } = useAuth()
  const { error, busy, run } = useAuthSubmit()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void run(() => login(email.trim(), password))
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-medium tracking-tight">Вход</h1>
      <p className="mt-2 text-sm text-content-secondary">
        Нет аккаунта?{' '}
        <Link to="/register" className="font-medium text-brand-hover hover:underline">
          Зарегистрироваться
        </Link>
      </p>
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
    </AuthShell>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const { error, busy, run } = useAuthSubmit()
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  return (
    <AuthShell>
      <h1 className="text-3xl font-medium tracking-tight">Регистрация ученика</h1>
      <p className="mt-2 text-sm text-content-secondary">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-medium text-brand-hover hover:underline">
          Войти
        </Link>
      </p>
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
        <Button type="submit" loading={busy} className="w-full py-3">
          Создать аккаунт
        </Button>
        <p className="text-xs text-content-secondary">Используйте только вымышленные данные — платформа работает в демонстрационном режиме.</p>
      </form>
    </AuthShell>
  )
}
