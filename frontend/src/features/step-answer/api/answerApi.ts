import { http, type Answers, type CompleteResult, type SubmitResult } from '@/shared/api'

export const answerApi = {
  /** Отметить теорию изученной */
  complete: (stepId: string) => http.post<CompleteResult>(`/learning/steps/${stepId}/complete`),
  /** Отправить ответ: автопроверка сразу или в очередь куратору */
  submit: (stepId: string, answers: Answers) => http.post<SubmitResult>(`/learning/steps/${stepId}/submit`, { answers }),
}
