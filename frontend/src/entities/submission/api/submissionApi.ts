import { http, type Page, type QueueItem, type ReviewSubmission, type Submission } from '@/shared/api'

export const submissionApi = {
  /** Своя работа ученика: статус, баллы, комментарий куратора */
  get: (id: string) => http.get<Submission>(`/learning/submissions/${id}`),
  /** Очередь ручной проверки (куратор / админ) */
  queue: (params: { course_id?: string; limit?: number; offset?: number }) => http.get<Page<QueueItem>>('/reviews/queue', params),
  /** Работа с ответом ученика и условием шага — для проверки */
  forReview: (id: string) => http.get<ReviewSubmission>(`/reviews/submissions/${id}`),
}
