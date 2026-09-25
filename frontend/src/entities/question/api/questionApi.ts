import { http, type QuestionList } from '@/shared/api'

export const questionApi = {
  /** Вопросы по шагу: ученику — свои, куратору — все по его курсам */
  forStep: (stepId: string) => http.get<QuestionList>(`/questions/steps/${stepId}`),
  mine: () => http.get<QuestionList>('/questions/mine'),
  /** Входящие вопросы куратора: сначала открытые, дольше всего ждущие — выше */
  inbox: (params: { status?: 'open' | 'answered'; course_id?: string } = {}) => http.get<QuestionList>('/questions/inbox', params),
}
