import { http, type AdminCourseTree, type CatalogCourse, type CourseOut, type CourseProgress, type NextStep, type Outline, type Page } from '@/shared/api'

export const courseApi = {
  /** Каталог опубликованных курсов (с записью текущего пользователя) */
  catalog: (limit = 100, offset = 0) => http.get<Page<CatalogCourse>>('/catalog/courses', { limit, offset }),
  outline: (courseId: string) => http.get<Outline>(`/catalog/courses/${courseId}/outline`),
  next: (courseId: string) => http.get<NextStep>(`/catalog/courses/${courseId}/next`),
  progress: (courseId: string) => http.get<CourseProgress>(`/progress/courses/${courseId}`),

  /** Все курсы, включая черновики (только админ) */
  adminList: () => http.get<CourseOut[]>('/admin/courses'),
  adminTree: (id: string) => http.get<AdminCourseTree>(`/admin/courses/${id}`),
}
