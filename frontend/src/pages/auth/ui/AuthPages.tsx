import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { STEP_TYPES } from '@/entities/step'
import { LoginForm, RegisterForm } from '@/features/auth'
import { Logo } from '@/shared/ui'

function AuthShell({ children }: { children: ReactNode }) {
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

export function LoginPage() {
  return (
    <AuthShell>
      <h1 className="text-3xl font-medium tracking-tight">Вход</h1>
      <p className="mt-2 text-sm text-content-secondary">
        Нет аккаунта?{' '}
        <Link to="/register" className="font-medium text-brand-hover hover:underline">
          Зарегистрироваться
        </Link>
      </p>
      <LoginForm />
    </AuthShell>
  )
}

export function RegisterPage() {
  return (
    <AuthShell>
      <h1 className="text-3xl font-medium tracking-tight">Регистрация ученика</h1>
      <p className="mt-2 text-sm text-content-secondary">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-medium text-brand-hover hover:underline">
          Войти
        </Link>
      </p>
      <RegisterForm />
    </AuthShell>
  )
}
