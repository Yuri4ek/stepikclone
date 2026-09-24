import { http, type CourseOut } from '@/shared/api'

export const manageCourseApi = {
  update: (id: string, data: { title?: string; description?: string }) => http.patch<CourseOut>(`/admin/courses/${id}`, data),
  publish: (id: string) => http.post<CourseOut>(`/admin/courses/${id}/publish`),
  assignCurator: (courseId: string, userId: string) =>
    http.post<{ course_id: string; user_id: string }>(`/admin/courses/${courseId}/curators`, { user_id: userId }),
}
