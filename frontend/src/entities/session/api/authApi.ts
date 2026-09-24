import { http, type AuthResponse, type User } from '@/shared/api'

export const authApi = {
  login: (email: string, password: string) => http.post<AuthResponse>('/auth/login', { email, password }),
  register: (email: string, password: string, full_name: string) =>
    http.post<AuthResponse>('/auth/register', { email, password, full_name, role: 'student' }),
  me: () => http.get<User>('/auth/me'),
}
