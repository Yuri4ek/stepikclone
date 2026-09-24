import { useState } from 'react'
import { StepTypeBadge, checkLabels, type StepTypeDef } from '@/entities/step'
import type { AdminStep, LearningStep, StepContent } from '@/shared/api'
import { Button, Card, ErrorBox, Field, Input, Notice, Segmented } from '@/shared/ui'
import { stepEditorApi } from '../api/stepEditorApi'

interface Props {
  type: StepTypeDef
  /** Существующий шаг или null для нового */
  step: AdminStep | null
  lessonId: string
  nextPosition: number
  onSaved: (step: AdminStep) => void
  onDeleted: () => void
  onCancel: () => void
}

function previewStep(type: StepTypeDef, title: string, maxScore: number, content: StepContent): LearningStep {
  // Как ученик увидит шаг: ответ на quiz бэкенд не отдаёт — убираем и тут
  const { correct_option_id: _hidden, ...visible } = content
  void _hidden
  return {
    id: 'preview',
    title: title || type.label,
    kind: type.kind,
    max_score: maxScore,
    content: visible,
    progress: { status: 'available', score: null, feedback: null },
  }
}

export function StepEditorPanel({ type, step, lessonId, nextPosition, onSaved, onDeleted, onCancel }: Props) {
  const [title, setTitle] = useState(step?.title ?? type.label)
  const [maxScore, setMaxScore] = useState(step?.max_score ?? type.defaultMaxScore)
  const [required, setRequired] = useState(step?.is_required ?? true)
  const [content, setContent] = useState<StepContent>(() => (step ? { type: type.id, ...step.content } : type.defaultContent()))
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null)
  const [error, setError] = useState<Error | string>()
  const [saved, setSaved] = useState(false)
  const scored = type.check !== 'none'

  const save = async () => {
    const invalid = type.validate?.(content)
    if (!title.trim()) return setError('Введите название шага')
    if (invalid) return setError(invalid)
    setBusy('save')
    setError(undefined)
    try {
      const data = { title: title.trim(), max_score: scored ? maxScore : 0, is_required: required, content }
      const res = step ? await stepEditorApi.update(step.id, data) : await stepEditorApi.add(lessonId, { ...data, kind: type.kind, position: nextPosition })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved(res)
    } catch (e) {
      setError(e as Error)
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    if (!step || !confirm(`Удалить шаг «${step.title}»? Прогресс учеников по нему пропадёт.`)) return
    setBusy('delete')
    try {
      await stepEditorApi.remove(step.id)
      onDeleted()
    } catch (e) {
      setError(e as Error)
      setBusy(null)
    }
  }

  return (
    <Card accent={type.color}>
      <div className="flex flex-wrap items-center gap-2 px-6 pt-5">
        <StepTypeBadge type={type} />
        <span className="text-xs text-content-secondary">
          {checkLabels[type.check]} · kind: <code>{type.kind}</code>
        </span>
        <Segmented
          className="ml-auto"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'edit', label: 'Редактор' },
            { value: 'preview', label: 'Глазами ученика' },
          ]}
        />
      </div>

      <div className="space-y-5 p-6">
        {!step && <Notice>Новый шаг появится у учеников после сохранения.</Notice>}
        {tab === 'edit' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <Field label="Название шага">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              {scored && (
                <Field label="Макс. баллов">
                  <Input type="number" min={0} step="1" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
                </Field>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="size-4 accent-brand" />
              Обязательный шаг (учитывается в проценте прохождения)
            </label>
            <type.Editor content={content} onChange={setContent} />
          </>
        ) : (
          <div className="rounded-3xl bg-white/80 p-6 shadow-inner">
            <h2 className="mb-4 text-xl font-medium">{title}</h2>
            <type.Player step={previewStep(type, title, maxScore, content)} content={previewStep(type, title, maxScore, content).content} busy={false} canSubmit={false} submit={() => {}} complete={() => {}} />
          </div>
        )}

        {error && <ErrorBox error={error} />}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button onClick={save} loading={busy === 'save'}>
            {step ? 'Сохранить' : 'Добавить шаг'}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            {step ? 'Закрыть' : 'Отмена'}
          </Button>
          {saved && <span className="text-sm text-status-success">✓ Сохранено</span>}
          {step && (
            <Button variant="ghost" className="ml-auto !text-status-error" onClick={remove} loading={busy === 'delete'}>
              Удалить шаг
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
