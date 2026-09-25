import { useEffect, useState } from 'react'


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

    }
  }, [key, value])
  return [value, setValue]
}
