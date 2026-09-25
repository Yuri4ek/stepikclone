import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DefaultReviewView, StepTypeBadge, resolveStepType, str } from '@/entities/step'
import { submissionApi, submissionTone } from '@/entities/submission'
import { ReviewForm } from '@/features/review-submission'
import type { ReviewResult } from '@/shared/api'
import { formatDate, formatScore, waitLabel, useAsync } from '@/shared/lib'
import { Button, Card, ErrorBox, Icon, Loader, Markdown, Notice, PageHeader, ScorePill, SectionLabel, StatusPill } from '@/shared/ui'

export function ReviewPage() {
  const { submissionId = '' } = useParams()
  const navigate = useNavigate()
  const { data: sub, error, loading, reload } = useAsync(() => submissionApi.forReview(submissionId), [submissionId])
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [loadingNext, setLoadingNext] = useState(false)

  if (loading && !sub) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!sub) return null

  const type = resolveStepType(sub.step.kind, sub.step.type)
  const max = sub.step.max_score
  const pending = sub.status === 'pending' && !result
  const View = type.ReviewView ?? DefaultReviewView
  const task = [str(sub.step.content, 'world') && `**Мир.** ${str(sub.step.content, 'world')}`, str(sub.step.content, 'markdown'), str(sub.step.content, 'question')].filter(Boolean).join('\n\n')
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

  const tone = submissionTone({ status: result?.status ?? sub.status, check_type: 'manual' })

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/curator/queue" className="inline-flex items-center gap-1 hover:text-brand-blue">
            <Icon name="arrowLeft" size={16} />
            Очередь проверки
          </Link>
        }
        title={sub.step.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <StatusPill tone={tone} />
            <StepTypeBadge type={type} />
            <span>
              {sub.student?.full_name ?? 'Ученик'} · {sub.attempt > 1 ? `попытка ${sub.attempt}, ` : ''}отправлено {formatDate(sub.created_at)}
              {pending && <span className="num">, ждёт {waitLabel(sub.created_at)}</span>}
            </span>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="p-5">
            <SectionLabel>Ответ ученика</SectionLabel>
            <View payload={sub.payload} content={sub.step.content} />
          </Card>
          {task && (
            <Card className="p-5">
              <SectionLabel>Задание</SectionLabel>
              <Markdown className="prose-sm">{task}</Markdown>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {criteria && (
            <Card className="p-5">
              <SectionLabel>Критерии</SectionLabel>
              <Markdown className="prose-sm">{criteria}</Markdown>
            </Card>
          )}

          {result ? (
            <Card className="p-5">
              <Notice tone={result.status === 'graded' ? 'success' : 'warning'}>
                <StatusPill tone={result.status === 'graded' ? 'done' : 'returned'} checkedBy={result.status === 'graded' ? 'manual' : null} />
                {result.score !== null && (
                  <ScorePill className="mt-2">
                    {formatScore(result.score)} из {formatScore(max)}
                  </ScorePill>
                )}
                <p className="mt-2">Ученик уже видит результат и комментарий, прогресс пересчитан.</p>
              </Notice>
              <Button className="mt-4 w-full" onClick={goNext} loading={loadingNext}>
                Следующая работа
                <Icon name="arrowRight" size={18} />
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
