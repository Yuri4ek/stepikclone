import { http, type LearningStep } from '@/shared/api'

export const stepApi = {

  get: (stepId: string) => http.get<LearningStep>(`/learning/steps/${stepId}`),
}
