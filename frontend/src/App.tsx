import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import type { Role } from './api'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Layout, PublicLayout } from './components/Layout'
import { EmptyState, Loader } from './components/ui'
import { HelpPage, NotFoundPage } from './pages/HelpPage'
import { LandingPage } from './pages/LandingPage'
import { ProfilePage } from './pages/ProfilePage'
import { HistoryPage } from './pages/student/HistoryPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage'
import { CourseBuilderPage } from './pages/admin/CourseBuilderPage'
import { LagPage } from './pages/curator/LagPage'
import { OverviewPage } from './pages/curator/OverviewPage'
import { QueuePage } from './pages/curator/QueuePage'
import { ReviewPage } from './pages/curator/ReviewPage'
import { CatalogPage } from './pages/student/CatalogPage'
import { CoursePage } from './pages/student/CoursePage'
import { DashboardPage } from './pages/student/DashboardPage'
import { ProgressPage } from './pages/student/ProgressPage'
import { StepPage } from './pages/student/StepPage'

const HOME: Record<Role, string> = { student: '/learn', curator: '/curator', admin: '/admin' }

function RequireAuth() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <Loader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) {
    return <EmptyState icon="🚫" title="Нет доступа">Этот раздел доступен другой роли.</EmptyState>
  }
  return <Outlet />
}

function PublicOnly() {
  const { user, ready } = useAuth()
  if (!ready) return <Loader />
  if (user) return <Navigate to={HOME[user.role]} replace />
  return <Outlet />
}

/** Главная: гостю — лендинг, вошедшему — его кабинет */
function Home() {
  const { user, ready } = useAuth()
  if (!ready) return <Loader />
  return user ? <Navigate to={HOME[user.role]} replace /> : <LandingPage />
}

/** Справка доступна всем: с кабинетом для вошедших, с публичной шапкой для гостей */
function AdaptiveLayout() {
  const { user, ready } = useAuth()
  if (!ready) return <Loader />
  return user ? <Layout /> : <PublicLayout />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
          </Route>
          <Route element={<AdaptiveLayout />}>
            <Route path="help" element={<HelpPage />} />
          </Route>

          <Route element={<PublicOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="courses/:courseId" element={<CoursePage />} />

              <Route element={<RequireRole roles={['student']} />}>
                <Route path="learn" element={<DashboardPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="courses/:courseId/steps/:stepId" element={<StepPage />} />
              </Route>
              {/* Прогресс — по своей записи на курс (для любой роли) */}
              <Route path="courses/:courseId/progress" element={<ProgressPage />} />

              <Route element={<RequireRole roles={['curator', 'admin']} />}>
                <Route path="curator" element={<OverviewPage />} />
                <Route path="curator/queue" element={<QueuePage />} />
                <Route path="curator/review/:submissionId" element={<ReviewPage />} />
                <Route path="curator/lag" element={<LagPage />} />
              </Route>

              <Route element={<RequireRole roles={['admin']} />}>
                <Route path="admin" element={<AdminCoursesPage />} />
                <Route path="admin/courses/:courseId" element={<CourseBuilderPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
