import { http } from './client'
import type {
  AdminCourseTree,
  AdminLesson,
  AdminModule,
  AdminStep,
  Answers,
  AuthResponse,
  CatalogCourse,
  CompleteResult,
  CourseOut,
  CourseProgress,
  Enrollment,
  LagItem,
  LagLevel,
  LearningStep,
  NextStep,
  Outline,
  Page,
  QueueItem,
  ReviewResult,
  ReviewSubmission,
  StepInput,
  Submission,
  SubmitResult,
  User,
} from './types'

export const api = {
  auth: {
    login: (email: string, password: string) =>
      http.post<AuthResponse>('/auth/login', { email, password }),
    register: (email: string, password: string, full_name: string) =>
      http.post<AuthResponse>('/auth/register', { email, password, full_name, role: 'student' }),
    me: () => http.get<User>('/auth/me'),
  },

  catalog: {
    courses: (limit = 100, offset = 0) =>
      http.get<Page<CatalogCourse>>('/catalog/courses', { limit, offset }),
    enroll: (courseId: string) => http.post<Enrollment>(`/catalog/courses/${courseId}/enroll`),
    outline: (courseId: string) => http.get<Outline>(`/catalog/courses/${courseId}/outline`),
    next: (courseId: string) => http.get<NextStep>(`/catalog/courses/${courseId}/next`),
  },

  learning: {
    step: (stepId: string) => http.get<LearningStep>(`/learning/steps/${stepId}`),
    complete: (stepId: string) => http.post<CompleteResult>(`/learning/steps/${stepId}/complete`),
    submit: (stepId: string, answers: Answers) =>
      http.post<SubmitResult>(`/learning/steps/${stepId}/submit`, { answers }),
    submission: (id: string) => http.get<Submission>(`/learning/submissions/${id}`),
  },

  progress: {
    course: (courseId: string) => http.get<CourseProgress>(`/progress/courses/${courseId}`),
  },

  reviews: {
    queue: (params: { course_id?: string; limit?: number; offset?: number }) =>
      http.get<Page<QueueItem>>('/reviews/queue', params),
    submission: (id: string) => http.get<ReviewSubmission>(`/reviews/submissions/${id}`),
    accept: (id: string, score: number, feedback: string) =>
      http.post<ReviewResult>(`/reviews/submissions/${id}/accept`, { score, feedback }),
    return: (id: string, feedback: string) =>
      http.post<ReviewResult>(`/reviews/submissions/${id}/return`, { feedback }),
  },

  lag: {
    students: (params: { course_id?: string; level?: LagLevel; limit?: number; offset?: number }) =>
      http.get<Page<LagItem>>('/lag/students', params),
  },

  admin: {
    courses: () => http.get<CourseOut[]>('/admin/courses'),
    createCourse: (data: { title: string; slug: string; description: string }) =>
      http.post<CourseOut>('/admin/courses', data),
    course: (id: string) => http.get<AdminCourseTree>(`/admin/courses/${id}`),
    updateCourse: (id: string, data: { title?: string; description?: string }) =>
      http.patch<CourseOut>(`/admin/courses/${id}`, data),
    publish: (id: string) => http.post<CourseOut>(`/admin/courses/${id}/publish`),
    addModule: (courseId: string, data: { title: string; position: number }) =>
      http.post<AdminModule>(`/admin/courses/${courseId}/modules`, data),
    deleteModule: (id: string) => http.del(`/admin/modules/${id}`),
    addLesson: (moduleId: string, data: { title: string; position: number }) =>
      http.post<AdminLesson>(`/admin/modules/${moduleId}/lessons`, data),
    deleteLesson: (id: string) => http.del(`/admin/lessons/${id}`),
    addStep: (lessonId: string, data: StepInput) =>
      http.post<AdminStep>(`/admin/lessons/${lessonId}/steps`, data),
    updateStep: (id: string, data: Partial<Omit<StepInput, 'kind'>>) =>
      http.patch<AdminStep>(`/admin/steps/${id}`, data),
    deleteStep: (id: string) => http.del(`/admin/steps/${id}`),
    assignCurator: (courseId: string, userId: string) =>
      http.post<{ course_id: string; user_id: string }>(`/admin/courses/${courseId}/curators`, {
        user_id: userId,
      }),
  },
}

export { ApiError } from './client'
export type * from './types'
