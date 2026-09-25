import { useState } from 'react'
import type { Question } from '@/shared/api'
import { Button, ErrorBox, Textarea } from '@/shared/ui'
import { answerQuestionApi } from '../api/answerQuestionApi'

/** Ответ куратора на вопрос ученика по шагу */
export function AnswerQuestionForm({ questionId, onAnswered }: { questionId: string; onAnswered: (q: Question) => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!text.trim()) return
        setBusy(true)
        setError(undefined)
        try {
          onAnswered(await answerQuestionApi.answer(questionId, text))
        } catch (err) {
          setError(err as Error)
        } finally {
          setBusy(false)
        }
      }}
    >
      <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ответ ученику: подсказка, а не готовое решение" />
      {error && <ErrorBox error={error} />}
      <Button type="submit" size="sm" loading={busy} disabled={!text.trim()}>
        Ответить
      </Button>
    </form>
  )
}
