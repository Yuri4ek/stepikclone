// В API нет списка работ ученика, но есть GET /learning/submissions/{id}.
// Поэтому id отправленных работ запоминаем на устройстве, а актуальный статус берём с сервера.

export interface LoggedSubmission {
  submission_id: string
  step_id: string
  step_title: string
  step_type: string
  course_id: string
  course_title: string
  created_at: string
}

const key = (userId: string) => `ks_submissions_${userId}`

export function readLog(userId: string): LoggedSubmission[] {
  try {
    return JSON.parse(localStorage.getItem(key(userId)) ?? '[]') as LoggedSubmission[]
  } catch {
    return []
  }
}

export function logSubmission(userId: string, entry: LoggedSubmission) {
  try {
    const list = [entry, ...readLog(userId).filter((e) => e.submission_id !== entry.submission_id)].slice(0, 200)
    localStorage.setItem(key(userId), JSON.stringify(list))
  } catch {
    /* хранилище недоступно — история на этом устройстве не сохранится */
  }
}
