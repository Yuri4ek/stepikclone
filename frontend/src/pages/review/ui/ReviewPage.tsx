import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DefaultReviewView, StepTypeBadge, str, typeFromContent } from '@/entities/step'
import { reviewStatusMeta, submissionApi } from '@/entities/submission'
import { ReviewForm } from '@/features/review-submission'
import type { ReviewResult } from '@/shared/api'
import { formatDate, formatScore, useAsync } from '@/shared/lib'
import { Badge, Button, Card, ErrorBox, Loader, Markdown, Notice, PageHeader, ScorePill } from '@/shared/ui'

export function ReviewPage() {
  const { submissionId = '' } = useParams()
  const navigate = useNavigate()
  const { data: sub, error, loading, reload } = useAsync(() => submissionApi.forReview(submissionId), [submissionId])
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [loadingNext, setLoadingNext] = useState(false)

  if (loading && !sub) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!sub) return null

  const type = typeFromContent(sub.step.content, sub.payload)
  const max = sub.step.max_score
  const pending = sub.status === 'pending' && !result
  const View = type.ReviewView ?? DefaultReviewView
  const task = str(sub.step.content, 'markdown') || str(sub.step.content, 'question')
  const criteria = str(sub.step.content, 'criteria')

  const goNext = async () => {
    setLoadingNext(true)
    try {
      const q = await submissionApi.queue({ limit: 5 })
      const nextItem = q.items.find((i) => i.submission_id !== submissionId)
      navigate(nextItem ? `/curator/review/${nextItem.submission_id}` : '/curator/queue')
      setResult(null)
    } finally {
      setLoadingNext(false)
    }
  }

  const st = reviewStatusMeta[result?.status ?? sub.status]

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
            <ReviewForm key={submissionId} submissionId={submissionId} maxScore={max} onReviewed={setResult} />
          ) : (
            <Notice>Работа уже проверена.</Notice>
          )}
        </div>
      </div>
    </>
  )
}
