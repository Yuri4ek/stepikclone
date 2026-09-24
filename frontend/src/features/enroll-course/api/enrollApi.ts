import { http, type Enrollment } from '@/shared/api'

export const enrollApi = {
  enroll: (courseId: string) => http.post<Enrollment>(`/catalog/courses/${courseId}/enroll`),
}
