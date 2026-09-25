import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'


export function useAuthSubmit() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<Error>()
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      navigate(from, { replace: true })
    } catch (e) {
      setError(e as Error)
    } finally {
      setBusy(false)
    }
  }
  return { error, busy, run }
}
