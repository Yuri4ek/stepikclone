import { http, type AdminLesson, type AdminModule, type AdminStep } from '@/shared/api'

/** Модули, уроки и порядок шагов в конструкторе курса */
export const structureApi = {
  addModule: (courseId: string, data: { title: string; position: number }) => http.post<AdminModule>(`/admin/courses/${courseId}/modules`, data),
  deleteModule: (id: string) => http.del(`/admin/modules/${id}`),
  addLesson: (moduleId: string, data: { title: string; position: number }) => http.post<AdminLesson>(`/admin/modules/${moduleId}/lessons`, data),
  deleteLesson: (id: string) => http.del(`/admin/lessons/${id}`),
  /** Поменять два шага местами */
  swapSteps: (a: AdminStep, b: AdminStep) =>
    Promise.all([
      http.patch<AdminStep>(`/admin/steps/${a.id}`, { position: b.position }),
      http.patch<AdminStep>(`/admin/steps/${b.id}`, { position: a.position }),
    ]),
}
