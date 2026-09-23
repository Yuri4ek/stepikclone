import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type ReviewResult } from '../../api'
import { formatDate, formatScore } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'
import { DefaultReviewView, str } from '../../steps/common'
import { typeFromContent } from '../../steps/registry'
import { Markdown } from '../../components/Markdown'
import { StepTypeBadge } from '../../components/StepTypeBadge'
import { Badge, Button, Card, ErrorBox, Field, Input, Loader, Notice, PageHeader, ScorePill, Textarea } from '../../components/ui'

const statusLabels = {
  pending: { label: 'Ждёт проверки', color: '#D97706' },
  graded: { label: 'Принято', color: '#10B981' },
  returned: { label: 'Возвращено', color: '#EF4444' },
}

export function ReviewPage() {
  const { submissionId = '' } = useParams()
  const navigate = useNavigate()
  const { data: sub, error, loading, reload } = useAsync(() => api.reviews.submission(submissionId), [submissionId])
  const [score, setScore] = useState<string>('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState<'accept' | 'return' | null>(null)
  const [actionError, setActionError] = useState<Error>()
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [loadingNext, setLoadingNext] = useState(false)

  if (loading && !sub) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!sub) return null

  const type = typeFromContent(sub.step.content, sub.payload)
  const max = sub.step.max_score
  const scoreNum = score === '' ? NaN : Number(score)
  const scoreValid = !Number.isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= max
  const pending = sub.status === 'pending' && !result
  const View = type.ReviewView ?? DefaultReviewView
  const task = str(sub.step.content, 'markdown') || str(sub.step.content, 'question')
  const criteria = str(sub.step.content, 'criteria')

  const act = async (kind: 'accept' | 'return') => {
    setBusy(kind)
    setActionError(undefined)
    try {
      const r = kind === 'accept' ? await api.reviews.accept(submissionId, scoreNum, feedback.trim()) : await api.reviews.return(submissionId, feedback.trim())
      setResult(r)
    } catch (e) {
      setActionError(e as Error)
    } finally {
      setBusy(null)
    }
  }

  const goNext = async () => {
    setLoadingNext(true)
    try {
      const q = await api.reviews.queue({ limit: 5 })
      const nextItem = q.items.find((i) => i.submission_id !== submissionId)
      navigate(nextItem ? `/curator/review/${nextItem.submission_id}` : '/curator/queue')
      setResult(null)
      setScore('')
      setFeedback('')
    } finally {
      setLoadingNext(false)
    }
  }

  const st = statusLabels[result?.status ?? sub.status]

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/curator/queue" className="hover:text-brand-hover">
            ← Очередь проверки
          </Link>
        }
        title={sub.step.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StepTypeBadge type={type} />
            <span>
              {sub.student.full_name} · сдано {formatDate(sub.created_at)}
            </span>
            <Badge color={st.color}>{st.label}</Badge>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="p-5" accent={type.color}>
            <h2 className="mb-3 font-medium">Ответ ученика</h2>
            <View payload={sub.payload} content={sub.step.content} />
          </Card>
          {task && (
            <Card className="p-5">
              <h2 className="mb-3 font-medium">Задание</h2>
              <Markdown className="prose-sm">{task}</Markdown>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {criteria && (
            <Card className="p-5">
              <div className="mb-1 text-sm text-content-secondary">Критерии</div>
              <Markdown className="prose-sm">{criteria}</Markdown>
            </Card>
          )}

          {result ? (
            <Card className="p-5">
              <Notice tone={result.status === 'graded' ? 'success' : 'warning'}>
                <div className="font-medium">{result.status === 'graded' ? '✓ Работа принята' : '↩ Работа возвращена'}</div>
                {result.score !== null && (
                  <ScorePill className="mt-2">
                    {formatScore(result.score)} из {formatScore(max)}
                  </ScorePill>
                )}
                <div className="mt-1">Ученик уже видит результат и комментарий.</div>
              </Notice>
              <Button className="mt-4 w-full" onClick={goNext} loading={loadingNext}>
                Следующая работа →
              </Button>
            </Card>
          ) : pending ? (
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
          ) : (
            <Notice>Работа уже проверена.</Notice>
          )}
        </div>
      </div>
    </>
  )
}
