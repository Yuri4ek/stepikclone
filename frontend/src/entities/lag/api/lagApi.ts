import { http, type LagItem, type LagLevel, type Page } from '@/shared/api'

export const lagApi = {
  /** Отстающие ученики; include_ok — все ученики курсов куратора вместе с теми, кто «В графике» */
  students: (params: { course_id?: string; level?: LagLevel; include_ok?: boolean; limit?: number; offset?: number }) => http.get<Page<LagItem>>('/lag/students', params),
}
