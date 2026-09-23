// Адрес сервера задаётся в frontend/.env (VITE_API_URL=http://host:port), префикс API добавляется здесь
const API_HOST: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
export const API_URL = API_HOST.replace(/\/+$/, '') + '/api/v1'

const TOKEN_KEY = 'ks_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

type ValidationItem = { loc?: (string | number)[]; msg?: string }

function detailToMessage(detail: unknown, status: number): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return (detail as ValidationItem[])
      .map((d) => {
        const field = d.loc?.filter((x) => x !== 'body').join('.')
        return field ? `${field}: ${d.msg}` : d.msg
      })
      .join('; ')
  }
  return `Ошибка ${status}`
}

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined | null>,
): Promise<T> {
  const url = new URL(API_URL + path)
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Сервер недоступен. Проверьте подключение.')
  }

  if (res.status === 204) return undefined as T
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.()
    const detail = (data as { detail?: unknown } | null)?.detail
    throw new ApiError(res.status, detailToMessage(detail, res.status))
  }
  return data as T
}

export const http = {
  get: <T>(path: string, query?: Record<string, string | number | undefined | null>) =>
    request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: (path: string) => request<void>('DELETE', path),
}
