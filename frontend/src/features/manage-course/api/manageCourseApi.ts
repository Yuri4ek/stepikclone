import { http, upload, type AdminUser, type CourseOut, type Role } from '@/shared/api'

export const manageCourseApi = {
  update: (id: string, data: { title?: string; description?: string }) => http.patch<CourseOut>(`/admin/courses/${id}`, data),
  publish: (id: string) => http.post<CourseOut>(`/admin/courses/${id}/publish`),
  uploadCover: (id: string, file: File) => upload<{ id: string; cover_url: string }>(`/admin/courses/${id}/cover`, file),
  users: (role?: Role) => http.get<AdminUser[]>('/admin/users', { role }),
  assignCurator: (courseId: string, userId: string) =>
    http.post<{ course_id: string; user_id: string }>(`/admin/courses/${courseId}/curators`, { user_id: userId }),
}
