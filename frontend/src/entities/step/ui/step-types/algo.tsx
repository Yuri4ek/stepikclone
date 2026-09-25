import { useState } from 'react'
import { cx } from '@/shared/lib'
import { runTests, type Language, type TestCase, type TestResult } from '@/shared/lib/code-runner'
import { Badge, Button, Field, Icon, Markdown, Select, Textarea } from '@/shared/ui'
import { list, str } from '../../lib/content'
import { useDraft } from '../../model/useDraft'
import { Criteria, CriteriaField, MarkdownField } from '../common'
import type { StepTypeDef } from '../../model/types'

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
      className="w-full rounded-card bg-brand-night p-5 font-mono text-[14px] leading-6 text-white caret-brand-sky focus:ring-2 focus:ring-brand-blue focus:outline-none disabled:opacity-70"
    />
  )
}

export function TestResults({ results }: { results: TestResult[] }) {
  const passed = results.filter((r) => r.passed).length
  const all = passed === results.length
  const firstFail = results.find((r) => !r.passed)
  return (
    <div className={cx('space-y-3 rounded-card border p-5', all ? 'border-st-done/20 bg-st-done-bg' : 'border-st-failed/20 bg-st-failed-bg')}>
      <div className="flex items-center gap-2 font-semibold">
        <Icon name={all ? 'check' : 'x'} size={20} strokeWidth={2.2} className={all ? 'text-st-done' : 'text-st-failed'} />
        <span className="num">
          Прошло {passed} {passed === 1 ? 'тест' : passed >= 2 && passed <= 4 ? 'теста' : 'тестов'} из {results.length}.
        </span>
        {!all && firstFail && (
          <span className="font-normal text-brand-ink-2">{firstFail.error ? 'Программа завершилась с ошибкой — посмотри на неё ниже.' : `Посмотри, что будет на вводе «${firstFail.input.trim().split('\n')[0] || 'пусто'}».`}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {results.map((r, i) => (
          <span key={i} className={cx('num inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold', r.passed ? 'bg-st-done text-white' : 'bg-white text-st-failed ring-1 ring-st-failed')} title={r.error ?? undefined}>
            <Icon name={r.passed ? 'check' : 'x'} size={12} strokeWidth={2.6} />
            {i + 1}
          </span>
        ))}
      </div>
      {results
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => !r.passed)
        .slice(0, 1)
        .map(({ r, i }) => (
          <div key={i} className="grid gap-3 rounded-field bg-white p-4 text-xs sm:grid-cols-3">
            <div>
              <div className="font-semibold text-brand-ink-2">Тест {i + 1}: ввод</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap">{r.input || '(пусто)'}</pre>
            </div>
            <div>
              <div className="font-semibold text-brand-ink-2">Ожидалось</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap">{r.expected}</pre>
            </div>
            <div>
              <div className="font-semibold text-brand-ink-2">{r.error ? 'Сообщение Python' : 'Получилось у тебя'}</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap text-st-failed">{r.error ?? (r.actual || '(пусто)')}</pre>
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
        <span className="mb-1.5 block text-sm font-semibold">Заготовка кода для ученика</span>
        <CodeEditor rows={5} value={str(content, 'starter_code')} onChange={(starter_code) => onChange({ ...content, starter_code })} />
      </div>
      <div>
        <div className="mb-2 text-sm font-semibold">Тесты: ввод и ожидаемый вывод</div>
        <div className="space-y-2">
          {tests.map((t, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-start gap-2">
              <span className="num pt-2.5 font-mono text-xs text-brand-ink-3">{i + 1}</span>
              <Textarea rows={2} className="min-h-0 font-mono" value={t.input} placeholder="ввод" onChange={(e) => setTests(tests.map((x, j) => (j === i ? { ...x, input: e.target.value } : x)))} />
              <Textarea rows={2} className="min-h-0 font-mono" value={t.output} placeholder="вывод" onChange={(e) => setTests(tests.map((x, j) => (j === i ? { ...x, output: e.target.value } : x)))} />
              <button type="button" onClick={() => setTests(tests.filter((_, j) => j !== i))} className="p-2 text-brand-ink-3 hover:text-brand-ink" aria-label="Удалить тест">
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => setTests([...tests, { input: '', output: '' }])}>
          <Icon name="plus" size={16} />
          Тест
        </Button>
      </div>
      <div className="rounded-card border border-brand-line bg-brand-mist p-5">
        <div className="mb-2 text-sm font-semibold">Эталонное решение — проверить тесты (не сохраняется)</div>
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
      {runner.running && runner.status && <span className="ml-3 text-sm text-brand-ink-2">{runner.status}</span>}
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
            <div key={i} className="rounded-card border border-brand-line bg-brand-mist p-4 text-sm">
              <div className="eyebrow text-brand-ink-3">Пример {i + 1} · ввод</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap">{t.input || '(пусто)'}</pre>
              <div className="eyebrow mt-3 text-brand-ink-3">вывод</div>
              <pre className="mt-1 font-mono whitespace-pre-wrap">{t.output}</pre>
            </div>
          ))}
        </div>
      )}
      <Criteria content={content} />
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Твоё решение</span>
          <Badge className="bg-brand-blue-50 font-mono text-brand-blue">{LANGS[language]}</Badge>
        </div>
        <CodeEditor value={code} onChange={setCode} disabled={!canSubmit} />
        <p className="mt-1.5 text-sm text-brand-ink-2">
          {language === 'python' ? 'Данные читай через input(), ответ выводи через print().' : 'Строки читай через input(), ответ выводи через print() или console.log().'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" loading={runner.running} disabled={!code.trim() || tests.length === 0} onClick={() => runner.run(language, code, tests)}>
          <Icon name="play" size={16} />
          Запустить тесты
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
          Отправить на проверку
        </Button>
        {runner.running && runner.status && <span className="text-sm text-brand-ink-2">{runner.status}</span>}
      </div>
      {runner.results && <TestResults results={runner.results} />}
      {runner.results && lastPassed === tests.length && canSubmit && (
        <p className="text-sm font-semibold text-st-done">Все тесты прошли — отправляй решение куратору.</p>
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
      <pre className="overflow-x-auto rounded-card bg-brand-night p-5 font-mono text-[13px] text-white">{code}</pre>
      {tests.length > 0 && (
        <Button size="sm" variant="secondary" loading={runner.running} onClick={() => runner.run(lang(content), code, tests)}>
          <Icon name="play" size={16} />
          Перепроверить на тестах
        </Button>
      )}
      {runner.results && <TestResults results={runner.results} />}
    </div>
  )
}

export const algoStep: StepTypeDef = {
  id: 'algo',
  kind: 'code',
  label: 'Задача с тестами',
  description: 'Код прогоняется по набору тестов, результат виден сразу; итоговые баллы подтверждает куратор.',
  icon: 'code',
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
