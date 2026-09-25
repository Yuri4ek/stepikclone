import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { courseApi, flattenOutline, sortOutline } from '@/entities/course'
import { CheckReport, StatusBadge, StepTypeBadge, checkLabels, resolveStepType, stepApi, type StepTypeDef } from '@/entities/step'
import { StepQuestions } from '@/features/ask-question'
import { answerApi } from '@/features/step-answer'
import { CourseMap } from '@/widgets/course-outline'
import { ApiError, type Answers, type CheckResult, type LearningStep, type SubmitResult } from '@/shared/api'
import { formatScore, plural, useAsync } from '@/shared/lib'
import { Button, ButtonLink, Card, ErrorBox, Icon, Loader, Notice, ProgressBar, ScorePill, StatusPill } from '@/shared/ui'

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

/** Результат автопроверки: ответ или прогон по тестам. Берётся из последней отправки — виден и после перезагрузки */
function AutoResult({ passed, feedback, result, score, max, type, nextId, courseId }: { passed: boolean; feedback: string | null; result: CheckResult | null | undefined; score: number | null; max: number; type: StepTypeDef; nextId?: string | null; courseId: string }) {
  const tests = type.check === 'tests'
  // «Верно» — служебный ответ сервера; показываем только содержательные пояснения и подсказки
  const note = feedback && feedback !== 'Верно' && !(tests && result) ? feedback : null
  if (passed) {
    return (
      <Notice tone="success">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <StatusPill tone="done" checkedBy="auto" />
            <span className="font-semibold">{tests ? 'Все тесты пройдены!' : 'Верно!'} Баллы уже в твоём прогрессе.</span>
          </span>
          {max > 0 && <Points score={score} max={max} />}
        </div>
        {note && <p className="mt-3">{note}</p>}
        {result && tests && (
          <div className="mt-3">
            <CheckReport result={result} compact />
          </div>
        )}
        {nextId && (
          <ButtonLink to={`/courses/${courseId}/steps/${nextId}`} className="mt-4">
            Следующий шаг
            <Icon name="arrowRight" size={18} />
          </ButtonLink>
        )}
      </Notice>
    )
  }
  return (
    <Notice tone="error">
      <StatusPill tone="failed" label={tests ? undefined : 'Не прошло проверку'} />
      {tests && result ? (
        <div className="mt-3">
          <CheckReport result={result} />
        </div>
      ) : (
        <p className="mt-2">{note ?? 'Пока не совпало с ответом.'} Попробуй ещё раз — результат будет сразу.</p>
      )}
    </Notice>
  )
}

/** Результат проверки. Тон — как тренер после тренировки: что получилось, что поправить, куда дальше */
function ResultBanner({ step, type, last, nextId, courseId }: { step: LearningStep; type: StepTypeDef; last: LastResult | null; nextId?: string | null; courseId: string }) {
  const status = step.progress.status
  const fb = step.progress.feedback
  const lastSub = step.progress.last_submission

  if (last?.kind === 'submit' && last.data.check_type === 'auto') {
    const d = last.data
    return <AutoResult passed={d.step_status === 'passed'} feedback={d.feedback} result={d.result} score={d.score} max={d.max_score} type={type} nextId={d.next_step_id} courseId={courseId} />
  }
  if (status === 'submitted') {
    return (
      <Notice tone="review">
        <StatusPill tone="review" />
        <p className="mt-2">Работа у куратора. Результат и комментарий появятся здесь, а пока можно идти дальше.</p>
        {nextId && (
          <ButtonLink to={`/courses/${courseId}/steps/${nextId}`} className="mt-4">
            Следующий шаг
            <Icon name="arrowRight" size={18} />
          </ButtonLink>
        )}
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
  if (status === 'failed' && lastSub?.check_type === 'auto') {
    return <AutoResult passed={false} feedback={lastSub.feedback} result={lastSub.result} score={lastSub.score} max={step.max_score} type={type} courseId={courseId} />
  }
  if (status === 'passed' && type.check !== 'none') {
    return (
      <Notice tone="success">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge status="passed" checkedBy={type.check === 'manual' ? 'manual' : 'auto'} />
          {step.max_score > 0 && <Points score={step.progress.best_score ?? step.progress.score} max={step.max_score} />}
        </div>
        {fb && type.check === 'manual' && <Comment text={fb} />}
      </Notice>
    )
  }
  return null
}

export function StepPage() {
  const { courseId = '', stepId = '' } = useParams()
  const navigate = useNavigate()
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

  const submit = (answers: Answers) => act(async () => ({ kind: 'submit', data: await answerApi.submit(stepId, answers) }))

  // «Готово, идём дальше»: теория засчитана — сразу открываем следующий шаг
  const complete = async () => {
    setBusy(true)
    setLastState(null)
    try {
      const res = await answerApi.complete(stepId)
      if (res.next_step_id) {
        await outline.reload()
        navigate(`/courses/${courseId}/steps/${res.next_step_id}`)
      } else {
        setLastState({ stepId, result: { kind: 'complete' } })
        await Promise.all([step.reload(), outline.reload(), progress.reload()])
      }
    } catch (e) {
      setLastState({ stepId, error: e as Error })
    } finally {
      setBusy(false)
    }
  }

  if (outline.error) return <ErrorBox error={outline.error} onRetry={outline.reload} />

  const s = step.data
  const type = s ? resolveStepType(s.kind, s.type) : null
  const st = s?.progress.status
  // Автопроверку можно пройти ещё раз (баллы — лучшая попытка); зачтённую куратором работу — нет
  const canSubmit = !!s && !!type && st !== 'submitted' && st !== 'locked' && !(st === 'passed' && type.check === 'manual')
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
              {current.module.title}
              {current.lesson.title !== current.module.title && ` · ${current.lesson.title}`}
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
              {st && (st === 'failed' && type.check !== 'tests' ? <StatusPill tone="failed" label="Не прошло проверку" /> : <StatusBadge status={st} />)}
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
            <ResultBanner step={s} type={type} last={last} nextId={nextLocked ? null : next?.id} courseId={courseId} />
            {actionError && <ErrorBox error={actionError} />}
            <type.Player key={s.id} step={s} content={s.content} busy={busy} canSubmit={canSubmit} submit={submit} complete={complete} />
          </div>
        </Card>
      )}

      {s && <StepQuestions stepId={s.id} />}

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
          <Button onClick={() => navigate(`/courses/${courseId}/steps/${next.id}`)} disabled={nextLocked} title={nextLocked ? 'Откроется, когда ты выполнишь этот шаг' : undefined}>
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
