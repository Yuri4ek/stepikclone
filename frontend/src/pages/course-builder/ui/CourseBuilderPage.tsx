import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courseApi, courseStatusMeta, nextPosition, sortCourseTree } from '@/entities/course'
import { StepTypeIcon, resolveStepType, type StepTypeDef } from '@/entities/step'
import { structureApi } from '@/features/edit-course-structure'
import { StepEditorPanel, TypePicker } from '@/features/edit-step'
import { CourseSettings } from '@/features/manage-course'
import type { AdminLesson, AdminStep } from '@/shared/api'
import { cx, useAsync } from '@/shared/lib'
import { Badge, Card, ErrorBox, InlineAdd, Loader, Notice } from '@/shared/ui'

type Selection =
  | { kind: 'course' }
  | { kind: 'step'; stepId: string }
  | { kind: 'pick'; lessonId: string }
  | { kind: 'new'; lessonId: string; type: StepTypeDef }

export function CourseBuilderPage() {
  const { courseId = '' } = useParams()
  const { data: raw, error, loading, reload } = useAsync(() => courseApi.adminTree(courseId), [courseId])
  const [sel, setSel] = useState<Selection>({ kind: 'course' })
  const [treeError, setTreeError] = useState<Error>()

  if (loading && !raw) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!raw) return null

  const tree = sortCourseTree(raw)
  const lessons = tree.modules.flatMap((m) => m.lessons)
  const allSteps = lessons.flatMap((l) => l.steps.map((s) => ({ step: s, lesson: l })))
  const findLesson = (id: string): AdminLesson | undefined => lessons.find((l) => l.id === id)
  const selectedStep = sel.kind === 'step' ? allSteps.find((x) => x.step.id === sel.stepId) : undefined

  const mutate = async (fn: () => Promise<unknown>) => {
    setTreeError(undefined)
    try {
      await fn()
      await reload()
    } catch (e) {
      setTreeError(e as Error)
    }
  }

  const move = (lesson: AdminLesson, i: number, dir: -1 | 1) => {
    const a = lesson.steps[i]
    const b = lesson.steps[i + dir]
    if (!a || !b) return
    void mutate(() => structureApi.swapSteps(a, b))
  }

  const stepType = (s: AdminStep) => resolveStepType(s.kind, s.content, s.id)

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to="/admin" className="text-sm text-content-secondary hover:text-brand-hover">
          ← Все курсы
        </Link>
        <h1 className="text-2xl font-medium">{tree.title}</h1>
        <Badge color={courseStatusMeta[tree.status].color}>{courseStatusMeta[tree.status].label}</Badge>
        {tree.status === 'published' && (
          <Link to={`/courses/${tree.id}`} className="ml-auto text-sm text-brand-hover hover:underline">
            Открыть как в каталоге ↗
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Дерево курса */}
        <aside className="space-y-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:px-1 lg:pb-6">
          <button onClick={() => setSel({ kind: 'course' })} className={cx('w-full rounded-full px-5 py-3 text-left text-sm font-medium transition-all', sel.kind === 'course' ? 'bg-gradient-to-r from-role-admin to-fuchsia-600 text-white shadow-lg shadow-role-admin/25' : 'glass text-content-primary hover:text-role-admin')}>
            ⚙ Настройки и публикация
          </button>
          {treeError && <ErrorBox error={treeError} />}

          {tree.modules.map((m, mi) => (
            <Card key={m.id} className="overflow-hidden">
              <div className="group flex items-center gap-2 px-5 pt-4 pb-1">
                <span className="rounded-full bg-role-admin/12 px-2 py-0.5 text-xs font-medium text-role-admin">М{mi + 1}</span>
                <span className="flex-1 truncate text-sm font-medium">{m.title}</span>
                <button
                  className="text-xs text-content-secondary lg:opacity-0 lg:group-hover:opacity-100 hover:text-status-error"
                  onClick={() => confirm(`Удалить модуль «${m.title}» со всеми уроками и шагами?`) && void mutate(() => structureApi.deleteModule(m.id))}
                  aria-label="Удалить модуль"
                >
                  Удалить
                </button>
              </div>
              <div className="space-y-3 p-3">
                {m.lessons.map((l, li) => (
                  <div key={l.id}>
                    <div className="group flex items-center gap-2 px-1 pb-1">
                      <span className="text-xs font-medium text-content-secondary">
                        {mi + 1}.{li + 1}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium">{l.title}</span>
                      <button
                        className="text-xs text-content-secondary lg:opacity-0 lg:group-hover:opacity-100 hover:text-status-error"
                        onClick={() => confirm(`Удалить урок «${l.title}»?`) && void mutate(() => structureApi.deleteLesson(l.id))}
                        aria-label="Удалить урок"
                      >
                        Удалить
                      </button>
                    </div>
                    <div className="space-y-1">
                      {l.steps.map((s, si) => {
                        const t = stepType(s)
                        const active = sel.kind === 'step' && sel.stepId === s.id
                        return (
                          <div key={s.id} className={cx('group flex items-center gap-2 rounded-2xl py-1.5 pr-1 pl-1.5 transition-colors', active ? 'bg-brand/12' : 'hover:bg-brand/5')}>
                            <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setSel({ kind: 'step', stepId: s.id })}>
                              <StepTypeIcon type={t} size="sm" />
                              <span className="truncate text-sm">{s.title}</span>
                            </button>
                            <span className="flex lg:opacity-0 lg:group-hover:opacity-100">
                              <button className="px-1 text-xs text-content-secondary hover:text-brand disabled:opacity-30" disabled={si === 0} onClick={() => move(l, si, -1)} aria-label="Выше">
                                ▲
                              </button>
                              <button className="px-1 text-xs text-content-secondary hover:text-brand disabled:opacity-30" disabled={si === l.steps.length - 1} onClick={() => move(l, si, 1)} aria-label="Ниже">
                                ▼
                              </button>
                            </span>
                          </div>
                        )
                      })}
                      <button
                        onClick={() => setSel({ kind: 'pick', lessonId: l.id })}
                        className={cx('w-full rounded-2xl px-3 py-2 text-left text-xs font-medium hover:bg-brand/8', (sel.kind === 'pick' || sel.kind === 'new') && sel.lessonId === l.id ? 'bg-brand/10 text-brand' : 'text-brand')}
                      >
                        + Шаг
                      </button>
                    </div>
                  </div>
                ))}
                <InlineAdd small label="Урок" placeholder="Название урока" onAdd={(title) => mutate(() => structureApi.addLesson(m.id, { title, position: nextPosition(m.lessons) }))} />
              </div>
            </Card>
          ))}
          <InlineAdd label="Модуль" placeholder="Название модуля" onAdd={(title) => mutate(() => structureApi.addModule(tree.id, { title, position: nextPosition(tree.modules) }))} />
        </aside>

        {/* Рабочая область */}
        <section className="min-w-0">
          {sel.kind === 'course' && <CourseSettings key={tree.id + tree.status} tree={tree} onChanged={reload} />}
          {sel.kind === 'pick' && <TypePicker onPick={(type) => setSel({ kind: 'new', lessonId: sel.lessonId, type })} onCancel={() => setSel({ kind: 'course' })} />}
          {sel.kind === 'new' && (
            <StepEditorPanel
              key={`new-${sel.lessonId}-${sel.type.id}`}
              type={sel.type}
              step={null}
              lessonId={sel.lessonId}
              nextPosition={nextPosition(findLesson(sel.lessonId)?.steps ?? [])}
              onSaved={async (s) => {
                await reload()
                setSel({ kind: 'step', stepId: s.id })
              }}
              onDeleted={() => setSel({ kind: 'course' })}
              onCancel={() => setSel({ kind: 'course' })}
            />
          )}
          {sel.kind === 'step' &&
            (selectedStep ? (
              <StepEditorPanel
                key={selectedStep.step.id}
                type={stepType(selectedStep.step)}
                step={selectedStep.step}
                lessonId={selectedStep.lesson.id}
                nextPosition={0}
                onSaved={() => void reload()}
                onDeleted={async () => {
                  await reload()
                  setSel({ kind: 'course' })
                }}
                onCancel={() => setSel({ kind: 'course' })}
              />
            ) : (
              <Notice>Шаг не найден</Notice>
            ))}
          {tree.modules.length === 0 && sel.kind === 'course' && (
            <Notice className="mt-4">Начните с добавления модуля слева, затем уроков и шагов.</Notice>
          )}
        </section>
      </div>
    </>
  )
}
