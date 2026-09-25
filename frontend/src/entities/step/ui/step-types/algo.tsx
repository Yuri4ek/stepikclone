import { useState } from 'react'
import { cx } from '@/shared/lib'
import { runTests, type TestCase, type TestResult } from '@/shared/lib/code-runner'
import { Badge, Button, Field, Icon, Input, Markdown, Textarea } from '@/shared/ui'
import { list, str } from '../../lib/content'
import { useDraft } from '../../model/useDraft'
import { MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

interface ServerTest extends TestCase {
  sample?: boolean
}

export function CodeEditor({ value, onChange, disabled, rows = 10 }: { value: string; onChange: (v: string) => void; disabled?: boolean; rows?: number }) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      rows={rows}
      spellCheck={false}
      aria-label="Код на Python"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return
        e.preventDefault()
        const t = e.currentTarget
        const { selectionStart: s, selectionEnd: end } = t
        const next = value.slice(0, s) + '    ' + value.slice(end)
        onChange(next)
        requestAnimationFrame(() => t.setSelectionRange(s + 4, s + 4))
      }}
      className="w-full rounded-card bg-brand-night p-5 font-mono text-[14px] leading-6 text-white caret-brand-sky focus:ring-2 focus:ring-brand-blue focus:outline-none disabled:opacity-70"
    />
  )
}


function LocalResults({ results }: { results: TestResult[] }) {
  const passed = results.filter((r) => r.passed).length
  const all = passed === results.length
  const fail = results.find((r) => !r.passed)
  return (
    <div className={cx('space-y-2 rounded-card border p-4 text-sm', all ? 'border-st-done/20 bg-st-done-bg' : 'border-brand-line bg-white')}>
      <div className="font-semibold">
        На примерах: {passed} из {results.length}
        {all && <span className="font-normal text-brand-ink-2"> — теперь отправь решение, сервер проверит его на всех тестах.</span>}
      </div>
      {fail && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs font-semibold text-brand-ink-2">Ввод</div>
            <pre className="mt-1 font-mono text-xs whitespace-pre-wrap">{fail.input || '(пусто)'}</pre>
          </div>
          <div>
            <div className="text-xs font-semibold text-brand-ink-2">Ожидалось</div>
            <pre className="mt-1 font-mono text-xs whitespace-pre-wrap">{fail.expected}</pre>
          </div>
          <div>
            <div className="text-xs font-semibold text-brand-ink-2">{fail.error ? 'Сообщение Python' : 'Получилось'}</div>
            <pre className="mt-1 font-mono text-xs whitespace-pre-wrap text-st-failed">{fail.error ?? (fail.actual || '(пусто)')}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

function useRunner() {
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [results, setResults] = useState<TestResult[] | null>(null)
  const run = async (code: string, tests: TestCase[]) => {
    setRunning(true)
    setStatus('')
    try {
      setResults(await runTests('python', code, tests, setStatus))
    } finally {
      setRunning(false)
    }
  }
  return { running, status, results, run }
}

function AlgoEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const tests = list<ServerTest>(content, 'tests')
  const setTests = (t: ServerTest[]) => onChange({ ...content, tests: t })
  const runner = useRunner()
  const reference = str(content, 'reference_solution')
  return (
    <div className="space-y-4">
      <MarkdownField label="Условие задачи" rows={10} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} hint="Легенда, формат входных и выходных данных. Примеры берутся из тестов с пометкой «пример»." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Язык">
          <Input value="Python 3" disabled />
        </Field>
        <Field label="Время на тест, мс">
          <Input type="number" min={100} step={100} value={Number(content.time_limit_ms ?? 1000)} onChange={(e) => onChange({ ...content, time_limit_ms: Number(e.target.value) })} />
        </Field>
        <Field label="Память, МБ">
          <Input type="number" min={16} step={16} value={Number(content.memory_limit_mb ?? 256)} onChange={(e) => onChange({ ...content, memory_limit_mb: Number(e.target.value) })} />
        </Field>
      </div>
      <div>
        <span className="mb-1.5 block text-sm font-semibold">Заготовка кода для ученика (необязательно)</span>
        <CodeEditor rows={4} value={str(content, 'starter_code')} onChange={(starter_code) => onChange({ ...content, starter_code })} />
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Тесты: ввод, ответ, видимость</div>
        <div className="space-y-2">
          {tests.map((t, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-start gap-2">
              <span className="num pt-2.5 font-mono text-xs text-brand-ink-3">{i + 1}</span>
              <Textarea rows={2} className="min-h-0 font-mono" value={t.input} placeholder="ввод" onChange={(e) => setTests(tests.map((x, j) => (j === i ? { ...x, input: e.target.value } : x)))} />
              <Textarea rows={2} className="min-h-0 font-mono" value={t.output} placeholder="ответ" onChange={(e) => setTests(tests.map((x, j) => (j === i ? { ...x, output: e.target.value } : x)))} />
              <label className="flex items-center gap-1.5 pt-2 text-xs whitespace-nowrap" title="Пример в условии: ученик видит ввод и ответ">
                <input type="checkbox" checked={!!t.sample} onChange={(e) => setTests(tests.map((x, j) => (j === i ? { ...x, sample: e.target.checked } : x)))} className="size-4 accent-[#3457F0]" />
                пример
              </label>
              <button type="button" onClick={() => setTests(tests.filter((_, j) => j !== i))} className="p-2 text-brand-ink-3 hover:text-brand-ink" aria-label="Удалить тест">
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => setTests([...tests, { input: '', output: '', sample: false }])}>
          <Icon name="plus" size={16} />
          Тест
        </Button>
        <p className="mt-2 text-xs text-brand-ink-2">Тесты без пометки «пример» скрыты: ученик видит только, прошёл тест или нет.</p>
      </div>
      <div className="rounded-card border border-brand-line bg-brand-mist p-5">
        <div className="mb-2 text-sm font-semibold">Эталонное решение — видят только куратор и администратор</div>
        <CodeEditor rows={6} value={reference} onChange={(reference_solution) => onChange({ ...content, reference_solution })} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" variant="secondary" loading={runner.running} onClick={() => runner.run(reference, tests)} disabled={!reference.trim() || !tests.length}>
            <Icon name="play" size={14} />
            Прогнать эталон по всем тестам
          </Button>
          {runner.running && runner.status && <span className="text-sm text-brand-ink-2">{runner.status}</span>}
        </div>
        {runner.results && (
          <div className="mt-3">
            <LocalResults results={runner.results} />
          </div>
        )}
      </div>
    </div>
  )
}

function AlgoPlayer({ step, content, busy, canSubmit, submit }: Parameters<StepTypeDef['Player']>[0]) {
  const samples = list<TestCase>(content, 'tests')
  const total = Number(content.tests_total ?? samples.length)
  // Черновик → последнее отправленное решение → заготовка
  const lastCode = str(step.progress.last_submission?.payload ?? {}, 'code')
  const [code, setCode] = useDraft(step.id, lastCode || str(content, 'starter_code'))
  const runner = useRunner()
  const tl = Number(content.time_limit_ms ?? 1000)
  const ml = Number(content.memory_limit_mb ?? 256)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge className="bg-st-idle-bg text-brand-ink-2">
          <span className="num">Время: {tl >= 1000 ? `${tl / 1000} с` : `${tl} мс`}</span>
        </Badge>
        <Badge className="bg-st-idle-bg text-brand-ink-2">
          <span className="num">Память: {ml} МБ</span>
        </Badge>
        <Badge className="bg-st-idle-bg text-brand-ink-2">
          <span className="num">Тестов: {total}</span>
        </Badge>
      </div>
      <Markdown>{str(content, 'markdown')}</Markdown>
      {samples.length > 0 && (
        <div>
          <div className="mb-2 font-bold">Примеры</div>
          <div className="overflow-hidden rounded-card border border-brand-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-mist text-left">
                  <th className="eyebrow w-12 px-4 py-2 text-brand-ink-3">№</th>
                  <th className="eyebrow px-4 py-2 text-brand-ink-3">Входные данные</th>
                  <th className="eyebrow px-4 py-2 text-brand-ink-3">Ответ</th>
                </tr>
              </thead>
              <tbody>
                {samples.map((t, i) => (
                  <tr key={i} className="border-t border-brand-line align-top">
                    <td className="num px-4 py-2 text-brand-ink-3">{i + 1}</td>
                    <td className="px-4 py-2">
                      <pre className="font-mono whitespace-pre-wrap">{t.input || '(пусто)'}</pre>
                    </td>
                    <td className="px-4 py-2">
                      <pre className="font-mono whitespace-pre-wrap">{t.output}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold">Твоё решение</span>
          <Badge className="bg-brand-blue-50 font-mono text-brand-blue">Python 3</Badge>
        </div>
        <CodeEditor value={code} onChange={setCode} disabled={!canSubmit} />
        <p className="mt-1.5 text-sm text-brand-ink-2">Данные читай через input(), ответ выводи через print() — без лишних слов.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button loading={busy} disabled={!canSubmit || !code.trim() || runner.running} onClick={() => submit({ code, language: 'python' })}>
          Отправить на проверку
        </Button>
        {samples.length > 0 && (
          <Button variant="secondary" loading={runner.running} disabled={!code.trim()} onClick={() => runner.run(code, samples)}>
            <Icon name="play" size={16} />
            Проверить на примерах
          </Button>
        )}
        {runner.running && runner.status && <span className="text-sm text-brand-ink-2">{runner.status}</span>}
      </div>
      {runner.results && <LocalResults results={runner.results} />}
    </div>
  )
}


export const algoStep: StepTypeDef = {
  id: 'algo',
  kind: 'code',
  label: 'Задача с тестами',
  description: 'Код на Python прогоняется на сервере по набору тестов, результат — сразу. Часть тестов можно скрыть.',
  group: 'Алгоритмика',
  icon: 'code',
  check: 'tests',
  defaultMaxScore: 10,
  defaultContent: () => ({
    type: 'algo',
    markdown: '### Входные данные\n\n\n\n### Выходные данные\n\n',
    language: 'python',
    time_limit_ms: 1000,
    memory_limit_mb: 256,
    starter_code: '',
    tests: [{ input: '', output: '', sample: true }],
    reference_solution: '',
  }),
  validate: (c) => {
    if (!str(c, 'markdown').trim()) return 'Введите условие'
    const tests = list<ServerTest>(c, 'tests')
    if (!tests.length) return 'Добавьте хотя бы один тест'
    if (tests.some((t) => !t.output.trim())) return 'У каждого теста должен быть ответ'
    return null
  },
  Editor: AlgoEditor,
  Player: AlgoPlayer,
}
