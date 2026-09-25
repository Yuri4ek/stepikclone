import { http, type AdminUser, type Role } from '@/shared/api'

export const userApi = {

  list: (role?: Role) => http.get<AdminUser[]>('/admin/users', { role }),
}
