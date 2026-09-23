import type { StepContent, StepKind } from '../api'
import { algoStep } from './algo'
import { answerStep } from './answer'
import { minecraftStep } from './minecraft'
import { projectStep } from './project'
import { quizStep } from './quiz'
import { scratchStep } from './scratch'
import { theoryStep } from './theory'
import type { StepTypeDef } from './types'

/**
 * Реестр типов шагов. Чтобы добавить новый тип (например, «Робототехника»):
 * 1) создать модуль со StepTypeDef (Editor + Player [+ ReviewView]),
 * 2) добавить его в этот список.
 * API и база не меняются: тип хранится в content.type, проверка — через kind.
 */
export const STEP_TYPES: StepTypeDef[] = [theoryStep, quizStep, answerStep, algoStep, scratchStep, minecraftStep, projectStep]

const byId = new Map(STEP_TYPES.map((t) => [t.id, t]))

/** Тип по умолчанию для kind, если content.type не задан (например, шаги из seed) */
const kindFallback: Record<StepKind, StepTypeDef> = {
  theory: theoryStep,
  quiz: quizStep,
  task: projectStep,
  code: algoStep,
}

const CACHE_KEY = 'ks_step_types'
let cache: Record<string, string> = {}
try {
  cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, string>
} catch {
  cache = {}
}

function remember(stepId: string, typeId: string) {
  if (cache[stepId] === typeId) return
  cache[stepId] = typeId
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* ignore */
  }
}

export function resolveStepType(kind: StepKind, content?: StepContent | null, stepId?: string): StepTypeDef {
  const declared = typeof content?.type === 'string' ? byId.get(content.type) : undefined
  if (declared && declared.kind === kind) {
    if (stepId) remember(stepId, declared.id)
    return declared
  }
  // В оглавлении курса content нет — используем тип, запомненный при открытии шага
  const cached = stepId ? byId.get(cache[stepId]) : undefined
  if (!content && cached && cached.kind === kind) return cached
  return kindFallback[kind] ?? projectStep
}

/** Когда kind неизвестен (карточка работы у куратора) — определяем тип по содержимому */
export function typeFromContent(content: StepContent, payload?: Record<string, unknown>): StepTypeDef {
  const declared = typeof content.type === 'string' ? byId.get(content.type) : undefined
  if (declared) return declared
  if (Array.isArray(content.tests) || payload?.language) return algoStep
  return projectStep
}

export function stepTypesForKind(kind: StepKind): StepTypeDef[] {
  return STEP_TYPES.filter((t) => t.kind === kind)
}

export const checkLabels: Record<StepTypeDef['check'], string> = {
  none: 'Без проверки',
  auto: 'Автопроверка',
  tests: 'Тесты + куратор',
  manual: 'Проверяет куратор',
}
