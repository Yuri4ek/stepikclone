import type { Answers, StepContent } from '@/shared/api'

// Безопасный доступ к полям произвольного JSON в content / answers

export function str(c: StepContent | Answers, key: string): string {
  const v = c[key]
  return typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v)
}

export function list<T>(c: StepContent | Answers, key: string): T[] {
  const v = c[key]
  return Array.isArray(v) ? (v as T[]) : []
}

export function isUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
