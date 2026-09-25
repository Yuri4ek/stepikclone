import { http, type Answers, type CompleteResult, type SubmitResult } from '@/shared/api'

export const answerApi = {

  complete: (stepId: string) => http.post<CompleteResult>(`/learning/steps/${stepId}/complete`),

  submit: (stepId: string, answers: Answers) => http.post<SubmitResult>(`/learning/steps/${stepId}/submit`, { answers }),
}
