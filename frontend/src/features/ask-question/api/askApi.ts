import { http, type Question } from '@/shared/api'

export const askApi = {
  ask: (stepId: string, text: string) => http.post<Question>(`/questions/steps/${stepId}`, { text }),
}
