import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler, tokenStore, type AuthResponse, type User } from '@/shared/api'
import { authApi } from '../api/authApi'

interface AuthState {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string, fullName: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(() => !tokenStore.get())

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!tokenStore.get()) return
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true))
  }, [logout])

  const accept = useCallback((res: AuthResponse) => {
    tokenStore.set(res.access_token)
    setUser(res.user)
    return res.user
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      logout,
      login: (email, password) => authApi.login(email, password).then(accept),
      register: (email, password, fullName) =>
        authApi.register(email, password, fullName).then(accept),
    }),
    [user, ready, logout, accept],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth вне AuthProvider')
  return ctx
}


// eslint-disable-next-line react/only-export-components
export function useUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('Нет пользователя')
  return user
}
