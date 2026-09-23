// Прогон решения по тестам в отдельном потоке: зависание кода ученика не вешает страницу.

export type Language = 'python' | 'javascript'

export interface RunRequest {
  language: Language
  code: string
  inputs: string[]
}

export type RunResponse =
  | { type: 'status'; message: string }
  | { type: 'done'; results: { output: string; error: string | null; timeMs: number }[] }

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.mjs'

interface Pyodide {
  globals: { set: (k: string, v: unknown) => void }
  runPython: (code: string) => unknown
}

let pyodide: Promise<Pyodide> | null = null

function loadPython(): Promise<Pyodide> {
  if (!pyodide) {
    pyodide = import(/* @vite-ignore */ PYODIDE_URL).then((m: { loadPyodide: () => Promise<Pyodide> }) => m.loadPyodide())
  }
  return pyodide
}

const PY_HARNESS = `
import sys, io, traceback
sys.stdin = io.StringIO(__input)
__out = io.StringIO()
sys.stdout = __out
__err = None
try:
    exec(__code, {'__name__': '__main__'})
except SystemExit:
    pass
except BaseException:
    __lines = traceback.format_exc().splitlines()
    __err = '\\n'.join(__lines[-3:])
finally:
    sys.stdout = sys.__stdout__
(__out.getvalue(), __err)
`

function runJs(code: string, input: string): { output: string; error: string | null } {
  const lines = input.split('\n')
  let cursor = 0
  const out: string[] = []
  const print = (...a: unknown[]) => out.push(a.map(String).join(' '))
  const readLine = () => (cursor < lines.length ? lines[cursor++] : '')
  const fakeConsole = { log: print, error: print, warn: print, info: print }
  try {
    new Function('input', 'readline', 'print', 'console', code)(readLine, readLine, print, fakeConsole)
    return { output: out.join('\n'), error: null }
  } catch (e) {
    return { output: out.join('\n'), error: String(e) }
  }
}

self.onmessage = async (e: MessageEvent<RunRequest>) => {
  const { language, code, inputs } = e.data
  const post = (m: RunResponse) => (self as unknown as Worker).postMessage(m)
  const results: { output: string; error: string | null; timeMs: number }[] = []

  if (language === 'python') {
    post({ type: 'status', message: 'Загружаем Python…' })
    let py: Pyodide
    try {
      py = await loadPython()
    } catch {
      pyodide = null
      post({ type: 'done', results: inputs.map(() => ({ output: '', error: 'Не удалось загрузить Python (нужен интернет)', timeMs: 0 })) })
      return
    }
    post({ type: 'status', message: 'Выполняем тесты…' })
    for (const input of inputs) {
      const t = performance.now()
      py.globals.set('__code', code)
      py.globals.set('__input', input)
      const res = py.runPython(PY_HARNESS) as { toJs: () => [string, string | null]; destroy?: () => void }
      const [output, error] = res.toJs()
      res.destroy?.()
      results.push({ output, error, timeMs: performance.now() - t })
    }
  } else {
    for (const input of inputs) {
      const t = performance.now()
      results.push({ ...runJs(code, input), timeMs: performance.now() - t })
    }
  }
  post({ type: 'done', results })
}
