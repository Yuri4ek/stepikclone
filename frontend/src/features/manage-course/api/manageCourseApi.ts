import { http, upload, type AdminUser, type CourseOut, type CoursePassport, type CoursePeople, type Role } from '@/shared/api'

export const manageCourseApi = {
  update: (id: string, data: { title?: string; description?: string; passport?: CoursePassport }) => http.patch<CourseOut>(`/admin/courses/${id}`, data),
  publish: (id: string) => http.post<CourseOut>(`/admin/courses/${id}/publish`),
  /** Снять с публикации: курс пропадёт из каталога, у записанных учеников останется */
  unpublish: (id: string) => http.post<CourseOut>(`/admin/courses/${id}/unpublish`),
  uploadCover: (id: string, file: File) => upload<{ id: string; cover_url: string }>(`/admin/courses/${id}/cover`, file),
  users: (role?: Role) => http.get<AdminUser[]>('/admin/users', { role }),
  people: (courseId: string) => http.get<CoursePeople>(`/admin/courses/${courseId}/people`),
  assignCurator: (courseId: string, userId: string) => http.post<{ course_id: string; user_id: string }>(`/admin/courses/${courseId}/curators`, { user_id: userId }),
  unassignCurator: (courseId: string, userId: string) => http.del(`/admin/courses/${courseId}/curators/${userId}`),
  enrollStudent: (courseId: string, userId: string) => http.post<{ enrollment_id: string }>(`/admin/courses/${courseId}/students`, { user_id: userId }),
  unenrollStudent: (courseId: string, userId: string) => http.del(`/admin/courses/${courseId}/students/${userId}`),
  createUser: (data: { email: string; full_name: string; role: Role; password: string }) => http.post<AdminUser>('/admin/users', data),
}
