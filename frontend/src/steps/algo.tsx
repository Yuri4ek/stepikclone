import { useState } from 'react'
import { Markdown } from '../components/Markdown'
import { Badge, Button, Field, Select, Textarea, cx } from '../components/ui'
import { CriteriaField, Criteria, MarkdownField, list, str, useDraft } from './common'
import { runTests, type Language, type TestCase, type TestResult } from './runner/runTests'
import type { StepTypeDef } from './types'

const LANGS: Record<Language, string> = { python: 'Python', javascript: 'JavaScript' }

function lang(c: Record<string, unknown>): Language {
  return str(c, 'language') === 'javascript' ? 'javascript' : 'python'
}

export function CodeEditor({ value, onChange, disabled, rows = 10 }: { value: string; onChange: (v: string) => void; disabled?: boolean; rows?: number }) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      rows={rows}
      spellCheck={false}
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
      className="w-full rounded-3xl bg-[#1B1E3F] p-5 font-mono text-sm leading-6 text-indigo-50 shadow-inner focus:ring-2 focus:ring-brand-violet/50 focus:outline-none disabled:opacity-70"
    />
  )
}

export function TestResults({ results }: { results: TestResult[] }) {
  const passed = results.filter((r) => r.passed).length
  const all = passed === results.length
  return (
    <div className="space-y-2">
      <div className={cx('font-medium', all ? 'text-status-success' : 'text-status-error')}>
        Пройдено тестов: {passed} из {results.length}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {results.map((r, i) => (
          <span key={i} className={cx('rounded-full px-2.5 py-0.5 font-mono text-xs font-medium text-white', r.passed ? 'bg-status-success' : 'bg-status-error')} title={r.error ?? undefined}>
            #{i + 1}
          </span>
        ))}
      </div>
      {results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => !r.passed)
        .slice(0, 1)
        .map(({ r, i }) => (
          <div key={i} className="grid gap-3 rounded-3xl bg-status-error/8 p-4 text-xs sm:grid-cols-3">
            <div>
              <div className="font-medium text-content-secondary">Тест #{i + 1}: ввод</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap">{r.input || '(пусто)'}</pre>
            </div>
            <div>
              <div className="font-medium text-content-secondary">Ожидалось</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap">{r.expected}</pre>
            </div>
            <div>
              <div className="font-medium text-content-secondary">{r.error ? 'Ошибка' : 'Получено'}</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap text-red-700">{r.error ?? (r.actual || '(пусто)')}</pre>
            </div>
          </div>
        ))}
    </div>
  )
}

function useRunner() {
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('')
  const [results, setResults] = useState<TestResult[] | null>(null)
  const run = async (language: Language, code: string, tests: TestCase[]) => {
    setRunning(true)
    setStatus('')
    try {
      const r = await runTests(language, code, tests, setStatus)
      setResults(r)
      return r
    } finally {
      setRunning(false)
    }
  }
  return { running, status, results, run }
}

function AlgoEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const tests = list<TestCase>(content, 'tests')
  const setTests = (t: TestCase[]) => onChange({ ...content, tests: t })
  const runner = useRunner()
  return (
    <div className="space-y-4">
      <MarkdownField label="Условие задачи" rows={8} value={str(content, 'markdown')} onChange={(markdown) => onChange({ ...content, markdown })} hint="Опишите формат ввода и вывода" />
      <Field label="Язык">
        <Select value={lang(content)} onChange={(e) => onChange({ ...content, language: e.target.value })} className="max-w-xs">
          {Object.entries(LANGS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <div>
        <span className="mb-1 block text-sm font-medium">Заготовка кода для ученика</span>
        <CodeEditor rows={5} value={str(content, 'starter_code')} onChange={(starter_code) => onChange({ ...content, starter_code })} />
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Тесты (ввод → ожидаемый вывод)</div>
        <div className="space-y-2">
          {tests.map((t, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-start gap-2">
              <span className="pt-2 font-mono text-xs text-content-secondary">#{i + 1}</span>
              <Textarea rows={2} className="min-h-0 font-mono" value={t.input} placeholder="ввод" onChange={(e) => setTests(tests.map((x, j) => (j === i ? { ...x, input: e.target.value } : x)))} />
              <Textarea rows={2} className="min-h-0 font-mono" value={t.output} placeholder="вывод" onChange={(e) => setTests(tests.map((x, j) => (j === i ? { ...x, output: e.target.value } : x)))} />
              <button type="button" onClick={() => setTests(tests.filter((_, j) => j !== i))} className="px-2 pt-2 text-content-secondary hover:text-status-error" aria-label="Удалить тест">
                ✕
              </button>
            </div>
          ))}
        </div>
        <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => setTests([...tests, { input: '', output: '' }])}>
          + Тест
        </Button>
      </div>
      <div className="rounded-3xl bg-brand/6 p-5">
        <div className="mb-2 text-sm font-medium">Эталонное решение — проверить тесты (не сохраняется)</div>
        <ReferenceCheck content={content} runner={runner} />
      </div>
      <CriteriaField content={content} onChange={onChange} />
    </div>
  )
}

function ReferenceCheck({ content, runner }: { content: Record<string, unknown>; runner: ReturnType<typeof useRunner> }) {
  const [code, setCode] = useState('')
  return (
    <div className="space-y-3">
      <CodeEditor rows={5} value={code} onChange={setCode} />
      <Button type="button" size="sm" variant="secondary" loading={runner.running} onClick={() => runner.run(lang(content), code, list<TestCase>(content, 'tests'))} disabled={!code.trim()}>
        Прогнать тесты
      </Button>
      {runner.running && runner.status && <span className="ml-3 text-sm text-content-secondary">{runner.status}</span>}
      {runner.results && <TestResults results={runner.results} />}
    </div>
  )
}

function AlgoPlayer({ step, content, busy, canSubmit, submit }: Parameters<StepTypeDef['Player']>[0]) {
  const language = lang(content)
  const tests = list<TestCase>(content, 'tests')
  const [code, setCode] = useDraft(step.id, str(content, 'starter_code'))
  const runner = useRunner()
  const lastPassed = runner.results?.filter((r) => r.passed).length ?? 0

  return (
    <div className="space-y-5">
      <Markdown>{str(content, 'markdown')}</Markdown>
      {tests.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tests.slice(0, 2).map((t, i) => (
            <div key={i} className="rounded-3xl bg-brand/6 p-4 text-sm">
              <div className="text-xs font-medium text-content-secondary">Пример {i + 1}: ввод</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap">{t.input || '(пусто)'}</pre>
              <div className="mt-2 text-xs font-medium text-content-secondary">вывод</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap">{t.output}</pre>
            </div>
          ))}
        </div>
      )}
      <Criteria content={content} />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Ваше решение</span>
          <Badge color="#2563EB">{LANGS[language]}</Badge>
        </div>
        <CodeEditor value={code} onChange={setCode} disabled={!canSubmit} />
        <p className="mt-1 text-xs text-content-secondary">
          {language === 'python' ? 'Читайте данные через input(), выводите через print().' : 'Читайте строки через input(), выводите через print() или console.log().'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" loading={runner.running} disabled={!code.trim() || tests.length === 0} onClick={() => runner.run(language, code, tests)}>
          ▶ Запустить тесты
        </Button>
        <Button
          loading={busy}
          disabled={!canSubmit || !code.trim() || runner.running}
          onClick={async () => {
            // Всегда перепрогоняем: код мог измениться после последнего запуска
            const res = tests.length ? await runner.run(language, code, tests) : []
            submit({
              text: code,
              language,
              tests_passed: res.filter((r) => r.passed).length,
              tests_total: res.length,
            })
          }}
        >
          Отправить решение
        </Button>
        {runner.running && runner.status && <span className="text-sm text-content-secondary">{runner.status}</span>}
      </div>
      {runner.results && <TestResults results={runner.results} />}
      {runner.results && lastPassed === tests.length && canSubmit && (
        <p className="text-sm text-status-success">Все тесты пройдены — отправляйте решение куратору.</p>
      )}
    </div>
  )
}

function AlgoReview({ payload, content }: { payload: Record<string, unknown>; content: Record<string, unknown> }) {
  const runner = useRunner()
  const code = str(payload, 'text')
  const tests = list<TestCase>(content, 'tests')
  const total = Number(payload.tests_total ?? 0)
  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="text-sm">
          У ученика пройдено тестов: <b>{String(payload.tests_passed ?? 0)}</b> из <b>{total}</b>
        </div>
      )}
      <pre className="overflow-x-auto rounded-3xl bg-[#1B1E3F] p-5 font-mono text-sm text-indigo-50">{code}</pre>
      {tests.length > 0 && (
        <Button size="sm" variant="secondary" loading={runner.running} onClick={() => runner.run(lang(content), code, tests)}>
          ▶ Перепроверить на тестах
        </Button>
      )}
      {runner.results && <TestResults results={runner.results} />}
    </div>
  )
}

export const algoStep: StepTypeDef = {
  id: 'algo',
  kind: 'code',
  label: 'Алгоритмика',
  description: 'Задача на программирование. Решение прогоняется по набору тестов, результат — сразу; итог подтверждает куратор.',
  icon: '⌨️',
  color: '#2563EB',
  check: 'tests',
  defaultMaxScore: 20,
  defaultContent: () => ({ type: 'algo', markdown: '', language: 'python', starter_code: '', tests: [{ input: '', output: '' }], criteria: '' }),
  validate: (c) => {
    if (!str(c, 'markdown').trim()) return 'Введите условие'
    const tests = list<TestCase>(c, 'tests')
    if (!tests.length) return 'Добавьте хотя бы один тест'
    if (tests.some((t) => !t.output.trim())) return 'У каждого теста должен быть ожидаемый вывод'
    return null
  },
  Editor: AlgoEditor,
  Player: AlgoPlayer,
  ReviewView: AlgoReview,
}
