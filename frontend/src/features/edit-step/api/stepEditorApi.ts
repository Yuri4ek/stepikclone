import { http, type AdminStep, type StepInput } from '@/shared/api'

export const stepEditorApi = {
  add: (lessonId: string, data: StepInput) => http.post<AdminStep>(`/admin/lessons/${lessonId}/steps`, data),
  update: (id: string, data: Partial<Omit<StepInput, 'kind'>>) => http.patch<AdminStep>(`/admin/steps/${id}`, data),
  remove: (id: string) => http.del(`/admin/steps/${id}`),
}
