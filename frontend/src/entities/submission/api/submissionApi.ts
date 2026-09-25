import { http, type Page, type QueueItem, type ReviewSubmission, type Submission, type SubmissionListItem, type SubmissionStatus } from '@/shared/api'

export const submissionApi = {

  mine: (params: { course_id?: string; status?: SubmissionStatus; limit?: number; offset?: number } = {}) => http.get<Page<SubmissionListItem>>('/learning/submissions', params),

  get: (id: string) => http.get<Submission>(`/learning/submissions/${id}`),

  queue: (params: { course_id?: string; limit?: number; offset?: number }) => http.get<Page<QueueItem>>('/reviews/queue', params),

  forReview: (id: string) => http.get<ReviewSubmission>(`/reviews/submissions/${id}`),
}
