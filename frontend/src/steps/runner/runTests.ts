import type { Language, RunResponse } from './worker'

export type { Language }

export interface TestCase {
  input: string
  output: string
}

export interface TestResult {
  input: string
  expected: string
  actual: string
  error: string | null
  passed: boolean
  timeMs: number
}

const TIMEOUT_MS = 10_000
const PY_LOAD_TIMEOUT_MS = 60_000

/** Сравнение вывода: без учёта хвостовых пробелов и пустых строк в конце */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim()
}

let worker: Worker | null = null
function getWorker(): Worker {
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  return worker
}

export function runTests(language: Language, code: string, tests: TestCase[], onStatus?: (m: string) => void): Promise<TestResult[]> {
  return new Promise((resolve) => {
    const w = getWorker()
    let timer = 0
    const arm = (ms: number) => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        // Бесконечный цикл: убиваем поток, следующий запуск создаст новый
        w.terminate()
        worker = null
        resolve(tests.map((t) => ({ input: t.input, expected: t.output, actual: '', error: 'Превышено время выполнения', passed: false, timeMs: ms })))
      }, ms)
    }
    arm(language === 'python' ? PY_LOAD_TIMEOUT_MS : TIMEOUT_MS)

    w.onmessage = (e: MessageEvent<RunResponse>) => {
      const m = e.data
      if (m.type === 'status') {
        onStatus?.(m.message)
        if (m.message.startsWith('Выполняем')) arm(TIMEOUT_MS)
        return
      }
      clearTimeout(timer)
      resolve(
        m.results.map((r, i) => ({
          input: tests[i].input,
          expected: tests[i].output,
          actual: r.output,
          error: r.error,
          timeMs: r.timeMs,
          passed: !r.error && normalizeOutput(r.output) === normalizeOutput(tests[i].output),
        })),
      )
    }
    w.postMessage({ language, code, inputs: tests.map((t) => t.input) })
  })
}
