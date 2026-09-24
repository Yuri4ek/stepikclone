import { http, type ReviewResult } from '@/shared/api'

export const reviewApi = {
  accept: (id: string, score: number, feedback: string) => http.post<ReviewResult>(`/reviews/submissions/${id}/accept`, { score, feedback }),
  return: (id: string, feedback: string) => http.post<ReviewResult>(`/reviews/submissions/${id}/return`, { feedback }),
}
