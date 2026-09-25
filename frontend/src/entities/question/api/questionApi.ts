import { http, type QuestionList } from '@/shared/api'

export const questionApi = {

  forStep: (stepId: string) => http.get<QuestionList>(`/questions/steps/${stepId}`),
  mine: () => http.get<QuestionList>('/questions/mine'),

  inbox: (params: { status?: 'open' | 'answered'; course_id?: string } = {}) => http.get<QuestionList>('/questions/inbox', params),
}
