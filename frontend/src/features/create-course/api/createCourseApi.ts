import { http, type CourseOut } from '@/shared/api'

export const createCourseApi = {
  create: (data: { title: string; slug: string; description: string }) => http.post<CourseOut>('/admin/courses', data),
}
