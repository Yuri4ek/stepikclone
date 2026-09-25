import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth, useUser } from '@/entities/session'
import { Avatar, roleMeta } from '@/entities/user'
import type { Role } from '@/shared/api'
import { cx } from '@/shared/lib'
import { ButtonLink, Icon, Logo, type IconName } from '@/shared/ui'

const nav: Record<Role, { to: string; label: string; icon: IconName }[]> = {
  student: [
    { to: '/learn', label: 'Главная', icon: 'flag' },
    { to: '/catalog', label: 'Курсы', icon: 'grid' },
    { to: '/history', label: 'Мои работы', icon: 'inbox' },
    { to: '/help', label: 'Как это работает', icon: 'question' },
  ],
  curator: [
    { to: '/curator', label: 'Обзор', icon: 'chart' },
    { to: '/curator/queue', label: 'Очередь проверки', icon: 'inbox' },
    { to: '/curator/lag', label: 'Ученики', icon: 'users' },
    { to: '/curator/questions', label: 'Вопросы', icon: 'message' },
    { to: '/catalog', label: 'Курсы', icon: 'grid' },
  ],
  admin: [
    { to: '/admin', label: 'Курсы', icon: 'layers' },
    { to: '/admin/users', label: 'Пользователи', icon: 'users' },
    { to: '/curator', label: 'Обзор', icon: 'chart' },
    { to: '/curator/queue', label: 'Очередь проверки', icon: 'inbox' },
    { to: '/curator/lag', label: 'Ученики', icon: 'user' },
    { to: '/curator/questions', label: 'Вопросы', icon: 'message' },
  ],
}

const exact = new Set(['/curator', '/admin'])

/**
 * Кабинет. У ученика — крупная шкала (кегль 18, кнопки 56), у куратора и администратора —
 * плотная (кегль 14–15): классы role-student / role-staff из tokens.css.
 */
export function Layout() {
  const user = useUser()
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const links = nav[user.role]
  const student = user.role === 'student'

  return (
    <div className={cx('flex min-h-screen flex-col bg-brand-mist', student ? 'role-student' : 'role-staff')}>
      <header className="sticky top-0 z-30 border-b border-brand-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={exact.has(l.to)}
                className={({ isActive }) =>
                  cx('rounded-btn px-3 py-2 text-[15px] font-semibold transition-colors', isActive ? 'bg-brand-blue-50 text-brand-blue' : 'text-brand-ink-2 hover:bg-brand-mist hover:text-brand-ink')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-1 lg:flex">
            <Link to="/profile" className="flex items-center gap-3 rounded-btn py-1 pr-1 pl-3 transition-colors hover:bg-brand-mist">
              <span className="text-right leading-tight">
                <span className="block text-sm font-semibold">{user.full_name}</span>
                <span className="block text-xs text-brand-ink-3">{roleMeta[user.role].label}</span>
              </span>
              <Avatar name={user.full_name} />
            </Link>
            <button onClick={logout} className="flex size-10 items-center justify-center rounded-btn text-brand-ink-3 transition-colors hover:bg-brand-mist hover:text-brand-ink" title="Выйти" aria-label="Выйти">
              <Icon name="logout" />
            </button>
          </div>
          <button className="ml-auto flex size-11 items-center justify-center rounded-btn hover:bg-brand-mist lg:hidden" onClick={() => setOpen(!open)} aria-label="Меню" aria-expanded={open}>
            <Icon name={open ? 'x' : 'menu'} size={24} />
          </button>
        </div>
        {open && (
          <div className="border-t border-brand-line bg-white px-4 pb-4 lg:hidden">
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 py-3">
              <Avatar name={user.full_name} />
              <span>
                <span className="block font-semibold">{user.full_name}</span>
                <span className="block text-xs text-brand-ink-3">{roleMeta[user.role].cabinet}</span>
              </span>
            </Link>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={exact.has(l.to)}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cx('flex items-center gap-3 rounded-btn px-3 py-3 font-semibold', isActive ? 'bg-brand-blue-50 text-brand-blue' : 'text-brand-ink-2')}
              >
                <Icon name={l.icon} />
                {l.label}
              </NavLink>
            ))}
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-btn px-3 py-3 text-left font-semibold text-brand-ink-2">
              <Icon name="logout" />
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
    <div className="flex min-h-screen flex-col bg-brand-mist">
      <header className="sticky top-0 z-30 border-b border-brand-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <ButtonLink to="/help" variant="ghost" className="hidden md:inline-flex">
              Как это работает
            </ButtonLink>
            <ButtonLink to="/login" variant="secondary" className="hidden sm:inline-flex">
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
    <footer className="border-t border-brand-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-brand-ink-3 sm:px-6">
        <span>
          <span className="font-semibold text-brand-ink-2">Федерация спортивного программирования Чувашской Республики</span> · подготовка школьников 1–9 классов
        </span>
        <span className="flex gap-4">
          <Link to="/help" className="hover:text-brand-blue">
            Как это работает
          </Link>
          <span>Все данные на стенде — вымышленные</span>
        </span>
      </div>
    </footer>
  )
}
