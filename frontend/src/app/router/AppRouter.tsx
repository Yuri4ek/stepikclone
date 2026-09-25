import { Route, Routes } from 'react-router-dom'
import { AdminCoursesPage } from '@/pages/admin-courses'
import { AdminUsersPage } from '@/pages/admin-users'
import { LoginPage, RegisterPage } from '@/pages/auth'
import { CatalogPage } from '@/pages/catalog'
import { CoursePage } from '@/pages/course'
import { CourseBuilderPage } from '@/pages/course-builder'
import { OverviewPage } from '@/pages/curator-overview'
import { DashboardPage } from '@/pages/dashboard'
import { HelpPage } from '@/pages/help'
import { HistoryPage } from '@/pages/history'
import { LagPage } from '@/pages/lag'
import { NotFoundPage } from '@/pages/not-found'
import { ProfilePage } from '@/pages/profile'
import { ProgressPage } from '@/pages/progress'
import { ReviewPage } from '@/pages/review'
import { QueuePage } from '@/pages/review-queue'
import { StepPage } from '@/pages/step'
import { Layout, PublicLayout } from '@/widgets/app-layout'
import { AdaptiveLayout, Home, PublicOnly, RequireAuth, RequireRole } from './guards'

export function AppRouter() {
  return (
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
            <Route path="admin/users" element={<AdminUsersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
