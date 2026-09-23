import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import type { Role } from '../api'
import { useUser, useAuth } from '../auth/AuthContext'
import { Avatar, ButtonLink, cx, roleMeta } from './ui'

export const BRAND = 'КодСтарт'

const nav: Record<Role, { to: string; label: string }[]> = {
  student: [
    { to: '/learn', label: 'Обучение' },
    { to: '/catalog', label: 'Каталог' },
    { to: '/history', label: 'Мои работы' },
    { to: '/help', label: 'Как это работает' },
  ],
  curator: [
    { to: '/curator', label: 'Обзор' },
    { to: '/curator/queue', label: 'Проверка' },
    { to: '/curator/lag', label: 'Отстающие' },
    { to: '/catalog', label: 'Курсы' },
  ],
  admin: [
    { to: '/admin', label: 'Конструктор' },
    { to: '/curator', label: 'Обзор' },
    { to: '/curator/queue', label: 'Проверка' },
    { to: '/curator/lag', label: 'Отстающие' },
    { to: '/catalog', label: 'Каталог' },
  ],
}

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className={cx('relative flex size-10 items-center justify-center rounded-2xl font-mono text-sm font-medium text-white shadow-lg', light ? 'bg-white/20 shadow-none' : 'bg-brand-gradient shadow-brand/30')}>
        {'</>'}
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rotate-45 rounded-[3px] bg-brand-crimson ring-2 ring-white" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className={cx('block text-lg font-medium tracking-tight', light ? 'text-white' : 'text-content-primary')}>{BRAND}</span>
        <span className={cx('block text-[11px]', light ? 'text-white/70' : 'text-content-secondary')}>
          Спортивное программирование · <span className={light ? 'text-white' : 'text-brand-crimson'}>Чувашия</span>
        </span>
      </span>
    </Link>
  )
}

export function Layout() {
  const user = useUser()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const role = roleMeta[user.role]
  const links = nav[user.role]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <div className="glass-strong mx-auto flex h-16 max-w-7xl items-center gap-4 rounded-full py-2 pr-2 pl-4 shadow-[0_8px_30px_-10px_rgb(61_90_254/0.25)]">
          <Logo />
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/curator' || l.to === '/admin'}
                className={({ isActive }) =>
                  cx('rounded-full px-4 py-2 text-sm font-medium transition-colors', isActive ? 'bg-brand/12 text-brand' : 'text-content-secondary hover:bg-brand/6 hover:text-content-primary')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link to="/profile" className="flex items-center gap-3 rounded-full py-1 pr-1 pl-4 transition-colors hover:bg-brand/6">
              <span className="text-right leading-tight">
                <span className="block text-sm font-medium">{user.full_name}</span>
                <span className="block text-xs font-medium" style={{ color: role.color }}>
                  {role.cabinet}
                </span>
              </span>
              <Avatar name={user.full_name} role={user.role} />
            </Link>
            <button onClick={logout} className="rounded-full px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-status-error/10 hover:text-status-error" title="Выйти">
              Выйти
            </button>
          </div>
          <button className="ml-auto flex size-11 items-center justify-center rounded-full hover:bg-brand/8 lg:hidden" onClick={() => setOpen(!open)} aria-label="Меню" aria-expanded={open}>
            <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {open && (
          <div className="glass-strong mx-auto mt-2 max-w-7xl rounded-[28px] p-3 shadow-xl lg:hidden">
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-brand/6">
              <Avatar name={user.full_name} role={user.role} />
              <span>
                <span className="block font-medium">{user.full_name}</span>
                <span className="block text-xs" style={{ color: role.color }}>
                  {role.cabinet}
                </span>
              </span>
            </Link>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/curator' || l.to === '/admin'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cx('block rounded-2xl px-4 py-3 text-sm font-medium', isActive ? 'bg-brand/10 text-brand' : 'text-content-secondary')}
              >
                {l.label}
              </NavLink>
            ))}
            <button onClick={logout} className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-status-error">
              Выйти
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

/** Оболочка для гостей: лендинг и справка */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <div className="glass-strong mx-auto flex h-16 max-w-7xl items-center gap-3 rounded-full py-2 pr-2 pl-4 shadow-[0_8px_30px_-10px_rgb(61_90_254/0.25)]">
          <Logo />
          <nav className="ml-auto flex gap-1 sm:gap-2">
            <ButtonLink to="/help" variant="ghost" className="hidden md:inline-flex">
              Как это работает
            </ButtonLink>
            <ButtonLink to="/login" variant="ghost" className="hidden sm:inline-flex">
              Войти
            </ButtonLink>
            <ButtonLink to="/register">Начать учиться</ButtonLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] bg-white/40 px-6 py-5 text-xs text-content-secondary backdrop-blur">
        <span>
          <span className="font-medium text-brand-crimson">Федерация спортивного программирования Чувашской Республики</span> · подготовка школьников 1–9 классов
        </span>
        <span className="flex gap-4">
          <Link to="/help" className="hover:text-brand">
            Как это работает
          </Link>
          <span>Данные на платформе — синтетические</span>
        </span>
      </div>
    </footer>
  )
}
