import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { STEP_TYPES } from '@/entities/step'
import { LoginForm, RegisterForm } from '@/features/auth'
import { Icon, Logo } from '@/shared/ui'


function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-brand-mist lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <aside className="night-glow relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
            <span className="size-1.5 rounded-full bg-brand-amber" aria-hidden />С 2027 года — базовый вид спорта в Чувашии
          </div>
          <h2 className="mt-8 max-w-lg text-5xl leading-[1.05] font-extrabold tracking-tight">
            Учись программировать шаг за шагом<span className="text-brand-sky">.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-white/70">Проходи курс в своём темпе, получай результат проверки сразу, а куратор поможет там, где нужна живая обратная связь.</p>
        </div>
        <div className="grid max-w-lg grid-cols-2 gap-3">
          {STEP_TYPES.filter((t) => ['theory', 'algo', 'scratch', 'minecraft'].includes(t.id)).map((t) => (
            <div key={t.id} className="rounded-card border border-white/10 bg-brand-night-2 p-5">
              <span className="flex size-10 items-center justify-center rounded-btn bg-brand-blue/20 text-brand-sky">
                <Icon name={t.icon} size={22} />
              </span>
              <div className="mt-3 font-semibold">{t.label}</div>
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
      <h1 className="text-[32px] font-extrabold tracking-tight">Вход</h1>
      <p className="mt-2 text-sm text-brand-ink-2">
        Нет аккаунта?{' '}
        <Link to="/register" className="font-semibold text-brand-blue hover:underline">
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
      <h1 className="text-[32px] font-extrabold tracking-tight">Регистрация ученика</h1>
      <p className="mt-2 text-sm text-brand-ink-2">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-semibold text-brand-blue hover:underline">
          Войти
        </Link>
      </p>
      <RegisterForm />
    </AuthShell>
  )
}
