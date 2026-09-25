import type { StepKind } from '@/shared/api'
import { algoStep } from '../ui/step-types/algo'
import { answerStep } from '../ui/step-types/answer'
import { minecraftStep } from '../ui/step-types/minecraft'
import { projectStep } from '../ui/step-types/project'
import { quizStep } from '../ui/step-types/quiz'
import { scratchAnswerStep, scratchStep } from '../ui/step-types/scratch'
import { theoryStep } from '../ui/step-types/theory'
import type { StepTypeDef } from './types'

/**
 * Реестр типов шагов. Чтобы добавить новый тип (например, «Робототехника»):
 * 1) создать модуль со StepTypeDef (Editor + Player [+ ReviewView]) в ui/step-types,
 * 2) добавить его в этот список.
 * API и база не меняются: тип хранится в content.type, проверка — механизмом kind из реестра бэкенда.
 * Шаг незнакомого фронтенду типа всё равно откроется — общим плеером своего механизма проверки.
 */
export const STEP_TYPES: StepTypeDef[] = [theoryStep, quizStep, answerStep, algoStep, scratchAnswerStep, scratchStep, minecraftStep, projectStep]

/** Общий тип для механизма проверки, если content.type фронтенду неизвестен */
const kindFallback: Record<string, StepTypeDef> = {
  theory: theoryStep,
  quiz: quizStep,
  task: projectStep,
  code: algoStep,
}

export function resolveStepType(kind: StepKind, type?: string | null): StepTypeDef {
  return STEP_TYPES.find((t) => t.id === type && t.kind === kind) ?? kindFallback[kind] ?? projectStep
}

export const checkLabels: Record<StepTypeDef['check'], string> = {
  none: 'Засчитывается при прочтении',
  auto: 'Автопроверка',
  tests: 'Прогон по тестам',
  manual: 'Проверяет куратор',
}
