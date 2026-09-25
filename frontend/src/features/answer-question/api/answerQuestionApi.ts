import { http, type Question } from '@/shared/api'

export const answerQuestionApi = {
  answer: (questionId: string, text: string) => http.post<Question>(`/questions/${questionId}/answer`, { text }),
}
