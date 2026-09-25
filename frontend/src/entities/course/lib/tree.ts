import type { AdminCourseTree } from '@/shared/api'

const byPos = <T extends { position: number }>(a: T, b: T) => a.position - b.position

export function sortCourseTree(t: AdminCourseTree): AdminCourseTree {
  return {
    ...t,
    modules: [...t.modules].sort(byPos).map((m) => ({
      ...m,
      lessons: [...m.lessons].sort(byPos).map((l) => ({ ...l, steps: [...l.steps].sort(byPos) })),
    })),
  }
}


export const nextPosition = (items: { position: number }[]) => items.reduce((m, i) => Math.max(m, i.position), 0) + 1
