import { http, type LearningStep } from '@/shared/api'

export const stepApi = {
  /** Шаг глазами ученика: content без правильных ответов + прогресс */
  get: (stepId: string) => http.get<LearningStep>(`/learning/steps/${stepId}`),
}
