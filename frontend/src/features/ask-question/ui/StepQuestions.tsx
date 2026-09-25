import { useState } from 'react'
import { questionApi, QuestionThread } from '@/entities/question'
import { useAsync } from '@/shared/lib'
import { Button, Card, ErrorBox, Icon, Textarea } from '@/shared/ui'
import { askApi } from '../api/askApi'

/** «Спросить куратора» на странице шага: вопрос привязан к шагу, ответ появится здесь же */
export function StepQuestions({ stepId }: { stepId: string }) {
  const { data, reload } = useAsync(() => questionApi.forStep(stepId), [stepId])
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()
  const items = data?.items ?? []

  const ask = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await askApi.ask(stepId, text)
      setText('')
      setOpen(false)
      await reload()
    } catch (e) {
      setError(e as Error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Вопрос куратору</h2>
          <p className="text-sm text-brand-ink-2">Что-то непонятно в этом шаге? Спроси — куратор ответит здесь же.</p>
        </div>
        {!open && (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <Icon name="message" size={18} />
            Задать вопрос
          </Button>
        )}
      </div>
      {open && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim()) void ask()
          }}
        >
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Например: почему на первом тесте выходит 31, а не 32?" autoFocus />
          {error && <ErrorBox error={error} />}
          <div className="flex gap-2">
            <Button type="submit" loading={busy} disabled={!text.trim()}>
              Отправить вопрос
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
          </div>
        </form>
      )}
      {items.length > 0 && (
        <div className="mt-5 space-y-5 border-t border-brand-line pt-5">
          {items.map((q) => (
            <QuestionThread key={q.id} q={q} />
          ))}
        </div>
      )}
    </Card>
  )
}
