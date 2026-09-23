import type { Outline, OutlineLesson, OutlineModule, OutlineStep } from '../api'

export interface FlatStep extends OutlineStep {
  lesson: OutlineLesson
  module: OutlineModule
  /** Сквозной номер шага в курсе, с 1 */
  index: number
}

const byPos = <T extends { position: number }>(a: T, b: T) => a.position - b.position

export function sortOutline(o: Outline): Outline {
  return {
    ...o,
    modules: [...o.modules].sort(byPos).map((m) => ({
      ...m,
      lessons: [...m.lessons].sort(byPos).map((l) => ({ ...l, steps: [...l.steps].sort(byPos) })),
    })),
  }
}

export function flattenOutline(o: Outline): FlatStep[] {
  const out: FlatStep[] = []
  for (const module of o.modules) {
    for (const lesson of module.lessons) {
      for (const step of lesson.steps) {
        out.push({ ...step, lesson, module, index: out.length + 1 })
      }
    }
  }
  return out
}

export function lessonStats(lesson: OutlineLesson) {
  const total = lesson.steps.length
  const passed = lesson.steps.filter((s) => s.progress.status === 'passed').length
  return { total, passed, done: total > 0 && passed === total }
}
