import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type AdminCourseTree, type AdminLesson, type AdminStep } from '../../api'
import { useAsync } from '../../lib/useAsync'
import { STEP_TYPES, checkLabels, resolveStepType } from '../../steps/registry'
import type { StepTypeDef } from '../../steps/types'
import { StepTypeIcon } from '../../components/StepTypeBadge'
import { Badge, Button, Card, ErrorBox, Field, Input, Loader, Notice, Textarea, cx } from '../../components/ui'
import { courseStatusMeta } from './AdminCoursesPage'
import { StepEditorPanel } from './StepEditorPanel'

type Selection =
  | { kind: 'course' }
  | { kind: 'step'; stepId: string }
  | { kind: 'pick'; lessonId: string }
  | { kind: 'new'; lessonId: string; type: StepTypeDef }

const byPos = <T extends { position: number }>(a: T, b: T) => a.position - b.position
const nextPos = (items: { position: number }[]) => items.reduce((m, i) => Math.max(m, i.position), 0) + 1

function sortTree(t: AdminCourseTree): AdminCourseTree {
  return {
    ...t,
    modules: [...t.modules].sort(byPos).map((m) => ({
      ...m,
      lessons: [...m.lessons].sort(byPos).map((l) => ({ ...l, steps: [...l.steps].sort(byPos) })),
    })),
  }
}

/** Поле ввода, которое появляется по кнопке: для добавления модуля / урока */
function InlineAdd({ label, placeholder, onAdd, small }: { label: string; placeholder: string; onAdd: (title: string) => Promise<void>; small?: boolean }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className={cx('w-full rounded-full bg-brand/6 text-left font-medium text-brand transition-colors hover:bg-brand/12', small ? 'px-4 py-2 text-xs' : 'px-5 py-3 text-sm')}>
        + {label}
      </button>
    )
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!value.trim()) return
        setBusy(true)
        try {
          await onAdd(value.trim())
          setValue('')
          setOpen(false)
        } finally {
          setBusy(false)
        }
      }}
    >
      <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
      <Button type="submit" size="sm" loading={busy}>
        OK
      </Button>
    </form>
  )
}

function TypePicker({ onPick, onCancel }: { onPick: (t: StepTypeDef) => void; onCancel: () => void }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Выберите тип шага</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {STEP_TYPES.map((t) => (
          <button key={t.id} onClick={() => onPick(t)} className="flex gap-4 rounded-3xl p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ color: t.color, backgroundImage: `linear-gradient(135deg, ${t.color}1F, ${t.color}08)` }}>
            <StepTypeIcon type={t} />
            <span className="text-content-primary">
              <span className="block font-medium">{t.label}</span>
              <span className="mt-0.5 block text-xs text-content-secondary">{t.description}</span>
              <span className="mt-2 inline-block text-xs font-medium" style={{ color: t.color }}>
                {checkLabels[t.check]}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-content-secondary">
        Новые типы шагов добавляются одним модулем в <code>src/steps</code> без изменения API и базы данных.
      </p>
    </Card>
  )
}

function CourseSettings({ tree, onChanged }: { tree: AdminCourseTree; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState({ title: tree.title, description: tree.description })
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [curatorId, setCuratorId] = useState('')
  const stepsCount = tree.modules.flatMap((m) => m.lessons.flatMap((l) => l.steps)).length

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key)
    setMsg(null)
    try {
      await fn()
      await onChanged()
      setMsg({ tone: 'success', text: ok })
    } catch (e) {
      setMsg({ tone: 'error', text: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-medium">Настройки курса</h2>
        <Field label="Название">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Описание">
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Button onClick={() => run('save', () => api.admin.updateCourse(tree.id, form), 'Изменения сохранены')} loading={busy === 'save'}>
          Сохранить
        </Button>
      </Card>

      <Card className="p-5" accent={tree.status === 'published' ? '#10B981' : '#64748B'}>
        <h2 className="font-medium">Публикация</h2>
        {tree.status === 'published' ? (
          <p className="mt-1 text-sm text-content-secondary">Курс опубликован и виден ученикам в каталоге. Изменения шагов применяются сразу.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-content-secondary">Черновик виден только администраторам. В курсе {stepsCount} шагов.</p>
            <Button className="mt-3" variant="success" disabled={stepsCount === 0} onClick={() => run('publish', () => api.admin.publish(tree.id), 'Курс опубликован')} loading={busy === 'publish'}>
              Опубликовать курс
            </Button>
          </>
        )}
      </Card>

      <Card className="p-5" accent="#0D9488">
        <h2 className="font-medium">Назначить куратора</h2>
        <p className="mt-1 text-sm text-content-secondary">Куратор увидит работы и отстающих учеников этого курса.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void run('curator', () => api.admin.assignCurator(tree.id, curatorId.trim()), 'Куратор назначен').then(() => setCuratorId(''))
          }}
        >
          <Input required value={curatorId} onChange={(e) => setCuratorId(e.target.value)} placeholder="ID пользователя (UUID)" className="font-mono" />
          <Button type="submit" loading={busy === 'curator'}>
            Назначить
          </Button>
        </form>
      </Card>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  )
}

export function CourseBuilderPage() {
  const { courseId = '' } = useParams()
  const { data: raw, error, loading, reload } = useAsync(() => api.admin.course(courseId), [courseId])
  const [sel, setSel] = useState<Selection>({ kind: 'course' })
  const [treeError, setTreeError] = useState<Error>()

  if (loading && !raw) return <Loader />
  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (!raw) return null

  const tree = sortTree(raw)
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
    void mutate(() => Promise.all([api.admin.updateStep(a.id, { position: b.position }), api.admin.updateStep(b.id, { position: a.position })]))
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
                  onClick={() => confirm(`Удалить модуль «${m.title}» со всеми уроками и шагами?`) && void mutate(() => api.admin.deleteModule(m.id))}
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
                        onClick={() => confirm(`Удалить урок «${l.title}»?`) && void mutate(() => api.admin.deleteLesson(l.id))}
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
                <InlineAdd small label="Урок" placeholder="Название урока" onAdd={(title) => mutate(() => api.admin.addLesson(m.id, { title, position: nextPos(m.lessons) }))} />
              </div>
            </Card>
          ))}
          <InlineAdd label="Модуль" placeholder="Название модуля" onAdd={(title) => mutate(() => api.admin.addModule(tree.id, { title, position: nextPos(tree.modules) }))} />
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
              nextPosition={nextPos(findLesson(sel.lessonId)?.steps ?? [])}
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
