import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { courseApi, flattenOutline, sortOutline } from '@/entities/course'
import { useUser } from '@/entities/session'
import { StatusBadge, StepTypeBadge, checkLabels, resolveStepType, stepApi, type StepTypeDef } from '@/entities/step'
import { logSubmission } from '@/entities/submission'
import { answerApi } from '@/features/step-answer'
import { CourseMap } from '@/widgets/course-outline'
import { ApiError, type Answers, type LearningStep, type SubmitResult } from '@/shared/api'
import { formatScore, plural, useAsync } from '@/shared/lib'
import { Button, Card, ErrorBox, Icon, Loader, Notice, ProgressBar, ScorePill, StatusPill } from '@/shared/ui'

type LastResult = { kind: 'submit'; data: SubmitResult } | { kind: 'complete' }

function Points({ score, max }: { score: number | null; max: number }) {
  return (
    <ScorePill>
      {formatScore(score)} из {formatScore(max)} {plural(Math.round(max), 'балла', 'баллов', 'баллов')}
    </ScorePill>
  )
}

function Comment({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-field bg-white p-4 whitespace-pre-wrap text-brand-ink">
      <div className="eyebrow mb-1 flex items-center gap-1.5 text-brand-ink-3">
        <Icon name="message" size={14} />
        Комментарий куратора
      </div>
      {text}
    </div>
  )
}

/** Результат проверки. Тон — как тренер после тренировки: что получилось, что поправить, куда дальше */
function ResultBanner({ step, type, last }: { step: LearningStep; type: StepTypeDef; last: LastResult | null }) {
  const status = step.progress.status
  const fb = step.progress.feedback

  if (last?.kind === 'submit' && last.data.check_type === 'auto') {
    const ok = last.data.step_status === 'passed'
    return ok ? (
      <Notice tone="success" className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <StatusPill tone="done" />
          <span className="font-semibold">Верно! Баллы уже в твоём прогрессе.</span>
        </span>
        <Points score={last.data.score} max={last.data.max_score} />
      </Notice>
    ) : (
      <Notice tone="error">
        <StatusPill tone="failed" label="Не прошло проверку" />
        <p className="mt-2">Пока не совпало с ответом. Перечитай условие и попробуй ещё раз — результат будет сразу.</p>
      </Notice>
    )
  }
  if (status === 'submitted') {
    return (
      <Notice tone="review">
        <StatusPill tone="review" />
        <p className="mt-2">Отправлено куратору. Результат и комментарий появятся здесь, а следующий шаг откроется, когда работу примут.</p>
      </Notice>
    )
  }
  if (status === 'returned') {
    return (
      <Notice tone="warning">
        <StatusPill tone="returned" />
        <p className="mt-2 font-semibold">Куратор вернул работу. Поправь и отправь снова — черновик сохранился.</p>
        {fb && <Comment text={fb} />}
      </Notice>
    )
  }
  if (status === 'passed' && type.check !== 'none') {
    return (
      <Notice tone="success">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status="passed" checkedBy={type.check === 'auto' ? 'auto' : 'manual'} />
          {step.max_score > 0 && <Points score={step.progress.score} max={step.max_score} />}
        </div>
        {fb && type.check !== 'auto' && <Comment text={fb} />}
      </Notice>
    )
  }
  return null
}

export function StepPage() {
  const { courseId = '', stepId = '' } = useParams()
  const navigate = useNavigate()
  const user = useUser()
  const outline = useAsync(() => courseApi.outline(courseId).then(sortOutline), [courseId])
  const step = useAsync(() => stepApi.get(stepId), [stepId])
  const progress = useAsync(() => courseApi.next(courseId), [courseId])
  const [busy, setBusy] = useState(false)
  // Результат последнего действия привязан к шагу — при переходе на другой шаг сбрасывается сам
  const [lastState, setLastState] = useState<{ stepId: string; result: LastResult; error?: undefined } | { stepId: string; result?: undefined; error: Error } | null>(null)
  const last = lastState?.stepId === stepId ? (lastState.result ?? null) : null
  const actionError = lastState?.stepId === stepId ? lastState.error : undefined

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [stepId])

  const flat = outline.data ? flattenOutline(outline.data) : []
  const idx = flat.findIndex((s) => s.id === stepId)
  const current = flat[idx]
  const prev = flat[idx - 1]
  const next = flat[idx + 1]
  const lessonSteps = current ? flat.filter((s) => s.lesson.id === current.lesson.id) : []

  const act = async (fn: () => Promise<LastResult>) => {
    setBusy(true)
    setLastState(null)
    try {
      const result = await fn()
      setLastState({ stepId, result })
      await Promise.all([step.reload(), outline.reload(), progress.reload()])
    } catch (e) {
      setLastState({ stepId, error: e as Error })
    } finally {
      setBusy(false)
    }
  }

  const submit = (answers: Answers) =>
    act(async () => {
      const data = await answerApi.submit(stepId, answers)
      logSubmission(user.id, {
        submission_id: data.submission_id,
        step_id: stepId,
        step_title: step.data?.title ?? '',
        step_type: step.data ? resolveStepType(step.data.kind, step.data.content).id : '',
        course_id: courseId,
        course_title: outline.data?.course.title ?? '',
        created_at: new Date().toISOString(),
      })
      return { kind: 'submit', data }
    })

  const complete = () =>
    act(async () => {
      await answerApi.complete(stepId)
      return { kind: 'complete' }
    })

  if (outline.error) return <ErrorBox error={outline.error} onRetry={outline.reload} />

  const s = step.data
  const type = s ? resolveStepType(s.kind, s.content, s.id) : null
  const st = s?.progress.status
  const canSubmit = !!s && !!type && st !== 'submitted' && st !== 'locked' && !(st === 'passed' && type.check !== 'auto')
  const coursePercent = progress.data?.percent ?? 0
  const nextLocked = next?.progress.status === 'locked'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link to={`/courses/${courseId}`} className="inline-flex items-center gap-1 text-sm text-brand-ink-2 hover:text-brand-blue">
            <Icon name="arrowLeft" size={16} />
            {outline.data?.course.title ?? 'Курс'}
          </Link>
          {current && (
            <div className="mt-1 font-semibold text-brand-ink-2">
              {current.module.title} · {current.lesson.title}
            </div>
          )}
        </div>
        <div className="flex w-56 items-center gap-3">
          <ProgressBar value={coursePercent} className="flex-1" />
          <span className="num text-sm font-semibold">{Math.round(coursePercent)}%</span>
        </div>
      </div>

      {lessonSteps.length > 1 && (
        <Card className="px-3 py-4">
          <CourseMap steps={lessonSteps} currentId={stepId} courseId={courseId} compact />
        </Card>
      )}

      {step.loading && !s && <Loader />}
      {step.error && <ErrorBox error={step.error instanceof ApiError && step.error.status === 400 ? 'Этот шаг пока закрыт — сначала пройди предыдущие.' : step.error} onRetry={step.reload} />}

      {s && type && (
        <Card>
          <div className="border-b border-brand-line px-5 pt-6 pb-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <StepTypeBadge type={type} />
              <span className="eyebrow text-brand-ink-3">{checkLabels[type.check]}</span>
              {st && <StatusBadge status={st} />}
              {s.max_score > 0 && <ScorePill className="ml-auto">до {formatScore(s.max_score)} баллов</ScorePill>}
            </div>
            <h1 className="mt-4 text-[32px] leading-[1.1] font-extrabold tracking-tight sm:text-[36px]">{s.title}</h1>
            {current && (
              <div className="num mt-2 text-xl font-bold text-brand-ink-2">
                Шаг {current.index} из {flat.length}
              </div>
            )}
          </div>
          <div className="space-y-6 px-5 py-6 sm:px-8">
            <ResultBanner step={s} type={type} last={last} />
            {actionError && <ErrorBox error={actionError} />}
            <type.Player key={s.id} step={s} content={s.content} busy={busy} canSubmit={canSubmit} submit={submit} complete={complete} />
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        {prev ? (
          <Button variant="secondary" onClick={() => navigate(`/courses/${courseId}/steps/${prev.id}`)}>
            <Icon name="arrowLeft" size={18} />
            Назад
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button onClick={() => navigate(`/courses/${courseId}/steps/${next.id}`)} disabled={nextLocked} title={nextLocked ? 'Откроется, когда этот шаг будет зачтён' : undefined}>
            {nextLocked && <Icon name="lock" size={18} />}
            {nextLocked ? 'Шаг закрыт' : 'Следующий шаг'}
            {!nextLocked && <Icon name="arrowRight" size={18} />}
          </Button>
        ) : (
          current && (
            <Button onClick={() => navigate(`/courses/${courseId}/progress`)}>
              Итоги курса
              <Icon name="arrowRight" size={18} />
            </Button>
          )
        )}
      </div>
    </div>
  )
}
