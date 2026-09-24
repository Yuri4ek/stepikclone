import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/entities/session'
import { LandingPage } from '@/pages/landing'
import { Layout, PublicLayout } from '@/widgets/app-layout'
import type { Role } from '@/shared/api'
import { EmptyState, Loader } from '@/shared/ui'

const HOME: Record<Role, string> = { student: '/learn', curator: '/curator', admin: '/admin' }

export function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <Loader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) {
    return <EmptyState icon="🚫" title="Нет доступа">Этот раздел доступен другой роли.</EmptyState>
  }
  return <Outlet />
}

export function PublicOnly() {
  const { user, ready } = useAuth()
  if (!ready) return <Loader />
  if (user) return <Navigate to={HOME[user.role]} replace />
  return <Outlet />
}

/** Главная: гостю — лендинг, вошедшему — его кабинет */
export function Home() {
  const { user, ready } = useAuth()
  if (!ready) return <Loader />
  return user ? <Navigate to={HOME[user.role]} replace /> : <LandingPage />
}

/** Справка доступна всем: с кабинетом для вошедших, с публичной шапкой для гостей */
export function AdaptiveLayout() {
  const { user, ready } = useAuth()
  if (!ready) return <Loader />
  return user ? <Layout /> : <PublicLayout />
}
