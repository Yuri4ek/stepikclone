import type { Answers, StepContent } from '@/shared/api'

// Безопасный доступ к полям произвольного JSON в content / answers

export function str(c: StepContent | Answers, key: string): string {
  const v = c[key]
  return typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v)
}

export function list<T>(c: StepContent | Answers, key: string): T[] {
  const v = c[key]
  return Array.isArray(v) ? (v as T[]) : []
}

export function isUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Поля, которые видят только куратор и система проверки (блоки «Правильный ответ», «Критерии проверки»,
 * «Эталонное решение» пакета содержания). Бэкенд не отдаёт их ученику — см. app/steps/registry.py.
 * Здесь тот же список нужен для предпросмотра «глазами ученика» в конструкторе.
 */
const PRIVATE_KEYS = ['correct_option_id', 'correct_option_ids', 'correct_answer', 'accepted_answers', 'criteria', 'reference_solution', 'hint', 'explanation']

export function studentView(content: StepContent): StepContent {
  const out: StepContent = { ...content }
  for (const k of PRIVATE_KEYS) delete out[k]
  if (Array.isArray(content.tests)) {
    const tests = content.tests as { input: string; output: string; sample?: boolean }[]
    out.tests = tests.filter((t) => t.sample).map(({ input, output }) => ({ input, output }))
    out.tests_total = tests.length
  }
  if ('options' in content || 'correct_answer' in content) {
    out.mode = content.multiple || Array.isArray(content.correct_option_ids) ? 'multiple' : list(content, 'options').length ? 'single' : 'answer'
  }
  return out
}

// ---------- Что сдаёт ученик в работе на ручную проверку ----------

export type FieldMode = 'required' | 'optional' | 'off'

export interface SubmitConfig {
  link: FieldMode
  screenshot: FieldMode
  text: FieldMode
}

export function submitConfig(content: StepContent, defaults: SubmitConfig): SubmitConfig {
  const raw = (content.submit ?? {}) as Partial<SubmitConfig>
  const mode = (v: unknown, d: FieldMode): FieldMode => (v === 'required' || v === 'optional' || v === 'off' ? v : d)
  return { link: mode(raw.link, defaults.link), screenshot: mode(raw.screenshot, defaults.screenshot), text: mode(raw.text, defaults.text) }
}

/** Куда ведёт ссылка: для Scratch проверяем адрес проекта, чтобы ребёнок не прислал ссылку на редактор */
export const linkKinds: Record<string, { label: string; placeholder: string; pattern?: RegExp; hint?: string }> = {
  scratch: {
    label: 'Ссылка на твой проект в Scratch',
    placeholder: 'https://scratch.mit.edu/projects/…',
    pattern: /^https?:\/\/scratch\.mit\.edu\/projects\/\d+/,
    hint: 'Нажми «Поделиться» в Scratch и скопируй адрес вида scratch.mit.edu/projects/123456',
  },
  makecode: {
    label: 'Ссылка на проект MakeCode',
    placeholder: 'https://makecode.com/_…',
    hint: 'В MakeCode: «Поделиться» → «Опубликовать» → скопируй ссылку',
  },
  any: { label: 'Ссылка на результат', placeholder: 'https://disk.yandex.ru/…' },
}

/** В шаге с ответом задан правильный ответ */
export function validateAnswerKey(c: StepContent): string | null {
  return str(c, 'correct_answer').trim() || str(c, 'correct_option_id').trim() ? null : 'Укажите правильный ответ'
}

export function scratchProjectId(url: string): string | null {
  return url.match(/scratch\.mit\.edu\/projects\/(\d+)/)?.[1] ?? null
}
