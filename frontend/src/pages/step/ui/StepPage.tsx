import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { courseApi, flattenOutline, sortOutline, type FlatStep } from '@/entities/course'
import { useUser } from '@/entities/session'
import { StatusBadge, StepTypeBadge, checkLabels, resolveStepType, stepApi, stepStatusMeta, type StepTypeDef } from '@/entities/step'
import { logSubmission } from '@/entities/submission'
import { answerApi } from '@/features/step-answer'
import { ApiError, type Answers, type LearningStep, type SubmitResult } from '@/shared/api'
import { cx, formatScore, useAsync } from '@/shared/lib'
import { Button, Card, ErrorBox, Loader, Notice, ProgressBar, ScorePill } from '@/shared/ui'

type LastResult = { kind: 'submit'; data: SubmitResult } | { kind: 'complete' }

function StepStrip({ steps, currentId, courseId }: { steps: FlatStep[]; currentId: string; courseId: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((s, i) => {
        const type = resolveStepType(s.kind, null, s.id)
        const st = s.progress.status
        const locked = st === 'locked'
        const current = s.id === currentId
        const bg = st === 'passed' ? '#10B981' : st === 'returned' || st === 'failed' ? '#EF4444' : st === 'submitted' ? '#F59E0B' : undefined
        const cls = cx(
          'relative flex size-10 items-center justify-center rounded-2xl text-sm transition-all',
          current ? 'scale-110 shadow-lg ring-2 ring-brand ring-offset-2 ring-offset-surface-bg' : 'hover:scale-105',
          locked && 'cursor-not-allowed opacity-40',
        )
        const style = { backgroundColor: bg ?? `${type.color}24`, color: bg ? 'white' : type.color }
        const label = `Шаг ${i + 1}: ${s.title} — ${type.label}, ${stepStatusMeta[st].label}`
        return locked ? (
          <span key={s.id} className={cls} style={style} title={label}>
            {type.icon}
          </span>
        ) : (
          <Link key={s.id} to={`/courses/${courseId}/steps/${s.id}`} className={cls} style={style} title={label} aria-current={current ? 'step' : undefined}>
            {st === 'passed' ? '✓' : type.icon}
          </Link>
        )
      })}
    </div>
  )
}

function ResultBanner({ step, type, last }: { step: LearningStep; type: StepTypeDef; last: LastResult | null }) {
  const status = step.progress.status
  const fb = step.progress.feedback

  if (last?.kind === 'submit' && last.data.check_type === 'auto') {
    const ok = last.data.step_status === 'passed'
    return (
      <Notice tone={ok ? 'success' : 'error'} className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-base font-medium">{ok ? '🎉 Верно!' : '✕ Неверно — попробуйте ещё раз'}</span>
        <ScorePill>
          {formatScore(last.data.score)} из {formatScore(last.data.max_score)} баллов
        </ScorePill>
      </Notice>
    )
  }
  if (status === 'submitted') {
    return (
      <Notice tone="warning">
        <div className="font-medium">⏳ Работа отправлена куратору</div>
        <div className="mt-0.5">Проверка обычно занимает до суток. Пока можно переходить к следующим шагам — прогресс обновится после проверки.</div>
      </Notice>
    )
  }
  if (status === 'returned') {
    return (
      <Notice tone="error">
        <div className="font-medium">↩ Куратор вернул работу на доработку</div>
        {fb && <div className="mt-2 rounded-2xl bg-white/70 p-4 whitespace-pre-wrap text-content-primary">💬 {fb}</div>}
        <div className="mt-2">Исправьте работу и отправьте снова.</div>
      </Notice>
    )
  }
  if (status === 'passed' && type.check !== 'none') {
    return (
      <Notice tone="success">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">✓ {type.check === 'auto' ? 'Шаг пройден' : 'Работа принята куратором'}</span>
          {step.max_score > 0 && (
            <ScorePill>
              {formatScore(step.progress.score)} из {formatScore(step.max_score)} баллов
            </ScorePill>
          )}
        </div>
        {fb && <div className="mt-2 rounded-2xl bg-white/70 p-4 whitespace-pre-wrap text-content-primary">💬 {fb}</div>}
      </Notice>
    )
  }
  if (status === 'failed' && fb) return <Notice tone="error">{fb}</Notice>
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

  return (
    <div className="space-y-5">
      {/* Шапка урока */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <Link to={`/courses/${courseId}`} className="text-sm text-content-secondary hover:text-brand-hover">
            ← {outline.data?.course.title ?? 'Курс'}
          </Link>
          {current && (
            <div className="mt-1 text-lg font-medium">
              {current.module.title} <span className="text-content-secondary">/</span> {current.lesson.title}
            </div>
          )}
        </div>
        <div className="flex w-48 items-center gap-2">
          <ProgressBar value={coursePercent} className="flex-1" />
          <span className="text-sm font-medium">{Math.round(coursePercent)}%</span>
        </div>
      </div>
      {lessonSteps.length > 0 && <StepStrip steps={lessonSteps} currentId={stepId} courseId={courseId} />}

      {step.loading && !s && <Loader />}
      {step.error && <ErrorBox error={step.error instanceof ApiError && step.error.status === 400 ? 'Этот шаг пока закрыт — сначала пройдите предыдущие.' : step.error} onRetry={step.reload} />}

      {s && type && (
        <Card accent={type.color} className="overflow-hidden">
          <div className="px-5 pt-6 pb-2 sm:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <StepTypeBadge type={type} />
              <span className="text-xs text-content-secondary">{checkLabels[type.check]}</span>
              {st && <StatusBadge status={st} />}
              {s.max_score > 0 && <ScorePill className="ml-auto">до {formatScore(s.max_score)} баллов</ScorePill>}
            </div>
            <h1 className="mt-3 text-3xl font-medium tracking-tight">{s.title}</h1>
            {current && <div className="text-sm text-content-secondary">Шаг {current.index} из {flat.length}</div>}
          </div>
          <div className="space-y-5 px-5 py-6 sm:px-8">
            <ResultBanner step={s} type={type} last={last} />
            {actionError && <ErrorBox error={actionError} />}
            <type.Player key={s.id} step={s} content={s.content} busy={busy} canSubmit={canSubmit} submit={submit} complete={complete} />
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        {prev ? (
          <Button variant="secondary" onClick={() => navigate(`/courses/${courseId}/steps/${prev.id}`)}>
            ← Назад
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button
            onClick={() => navigate(`/courses/${courseId}/steps/${next.id}`)}
            disabled={next.progress.status === 'locked'}
            title={next.progress.status === 'locked' ? 'Сначала пройдите этот шаг' : undefined}
          >
            Следующий шаг →
          </Button>
        ) : (
          current && (
            <Button onClick={() => navigate(`/courses/${courseId}/progress`)} variant="success">
              Итоги курса 🏆
            </Button>
          )
        )}
      </div>
    </div>
  )
}
