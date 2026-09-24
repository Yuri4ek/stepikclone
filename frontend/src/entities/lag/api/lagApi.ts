import { http, type LagItem, type LagLevel, type Page } from '@/shared/api'

export const lagApi = {
  students: (params: { course_id?: string; level?: LagLevel; limit?: number; offset?: number }) => http.get<Page<LagItem>>('/lag/students', params),
}
