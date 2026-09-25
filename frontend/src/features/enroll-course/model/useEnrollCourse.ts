import { useState } from 'react'
import { enrollApi } from '../api/enrollApi'


export function useEnrollCourse(courseId: string, onEnrolled?: () => void | Promise<void>) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()

  const enroll = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await enrollApi.enroll(courseId)
      await onEnrolled?.()
    } catch (e) {
      setError(e as Error)
    } finally {
      setBusy(false)
    }
  }

  return { enroll, busy, error }
}
