import { useState } from 'react'
import type { ReviewResult } from '@/shared/api'
import { formatScore } from '@/shared/lib'
import { Button, Card, ErrorBox, Field, Input, Textarea } from '@/shared/ui'
import { reviewApi } from '../api/reviewApi'

/** Оценка работы куратором: принять с баллами или вернуть с комментарием */
export function ReviewForm({ submissionId, maxScore: max, onReviewed }: { submissionId: string; maxScore: number; onReviewed: (r: ReviewResult) => void }) {
  const [score, setScore] = useState<string>('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState<'accept' | 'return' | null>(null)
  const [actionError, setActionError] = useState<Error>()

  const scoreNum = score === '' ? NaN : Number(score)
  const scoreValid = !Number.isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= max

  const act = async (kind: 'accept' | 'return') => {
    setBusy(kind)
    setActionError(undefined)
    try {
      const r = kind === 'accept' ? await reviewApi.accept(submissionId, scoreNum, feedback.trim()) : await reviewApi.return(submissionId, feedback.trim())
      onReviewed(r)
    } catch (e) {
      setActionError(e as Error)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-medium">Оценка</h2>
      <Field label={`Баллы (0–${formatScore(max)})`}>
        <div className="flex gap-2">
          <Input type="number" min={0} max={max} step="0.5" value={score} onChange={(e) => setScore(e.target.value)} className="w-28" />
          {[1, 0.75, 0.5].map((k) => (
            <button key={k} type="button" onClick={() => setScore(String(Math.round(max * k * 2) / 2))} className="rounded-full bg-amber-400/15 px-3.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-400/30">
              {formatScore(Math.round(max * k * 2) / 2)}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Комментарий ученику" hint="Для возврата обязателен: объясните, что исправить">
        <Textarea rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Что получилось хорошо и что можно улучшить" />
      </Field>
      {actionError && <ErrorBox error={actionError} />}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="success" onClick={() => act('accept')} loading={busy === 'accept'} disabled={!scoreValid || !!busy}>
          ✓ Принять
        </Button>
        <Button variant="danger" onClick={() => act('return')} loading={busy === 'return'} disabled={!feedback.trim() || !!busy}>
          ↩ Вернуть
        </Button>
      </div>
    </Card>
  )
}
