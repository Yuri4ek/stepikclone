import { useEffect, useState } from 'react'

/** Черновик ответа хранится в браузере — не теряется при перезагрузке и после возврата работы */
export function useDraft<T>(stepId: string, initial: T): [T, (v: T) => void] {
  const key = `ks_draft_${stepId}`
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* хранилище недоступно — черновик просто не сохранится */
    }
  }, [key, value])
  return [value, setValue]
}
