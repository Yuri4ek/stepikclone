import { useState } from 'react'
import type { ReviewResult } from '@/shared/api'
import { formatScore } from '@/shared/lib'
import { Button, Card, ErrorBox, Field, Icon, Input, Textarea } from '@/shared/ui'
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
      <h2 className="text-lg font-bold">Оценка</h2>
      <Field label={`Баллы (0–${formatScore(max)})`}>
        <div className="flex gap-2">
          <Input type="number" min={0} max={max} step="0.5" value={score} onChange={(e) => setScore(e.target.value)} className="w-28" />
          {[1, 0.75, 0.5].map((k) => (
            <button key={k} type="button" onClick={() => setScore(String(Math.round(max * k * 2) / 2))} className="num rounded-field border border-brand-line px-3 text-sm font-semibold text-brand-ink-2 transition-colors hover:border-brand-blue-200 hover:bg-brand-blue-50 hover:text-brand-blue">
              {formatScore(Math.round(max * k * 2) / 2)}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Комментарий ученику" hint="Для возврата обязателен. Пишите на «ты», коротко: что получилось, что поправить">
        <Textarea rows={5} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Кот доходит до края и останавливается. Добавь поворот в конце цикла." />
      </Field>
      {actionError && <ErrorBox error={actionError} />}
      <div className="grid gap-2">
        <Button onClick={() => act('accept')} loading={busy === 'accept'} disabled={!scoreValid || !!busy}>
          <Icon name="check" size={18} />
          Зачесть
        </Button>
        <Button variant="amber" onClick={() => act('return')} loading={busy === 'return'} disabled={!feedback.trim() || !!busy}>
          <Icon name="undo" size={18} />
          Вернуть с комментарием
        </Button>
      </div>
    </Card>
  )
}
