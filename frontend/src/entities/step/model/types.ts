import type { FC } from 'react'
import type { Answers, LearningStep, StepContent, StepKind } from '@/shared/api'

/** tests — прогон по тестам сразу у ученика + подтверждение куратором */
export type CheckMode = 'none' | 'auto' | 'tests' | 'manual'

export interface EditorProps {
  content: StepContent
  onChange: (content: StepContent) => void
}

export interface PlayerProps {
  step: LearningStep
  content: StepContent
  /** Запрос отправки в процессе */
  busy: boolean
  /** Можно ли сейчас отправлять ответ (нет работы на проверке, шаг не закрыт) */
  canSubmit: boolean
  submit: (answers: Answers) => void
  complete: () => void
}

export interface ReviewViewProps {
  payload: Answers
  content: StepContent
}

/**
 * Описание типа шага. Бэкенд знает только 4 `kind` (theory/quiz/task/code) и хранит
 * произвольный JSON в `content`. Тип шага на платформе — это `content.type` + способ проверки,
 * поэтому новый тип (например, «Робототехника») добавляется одним модулем без изменения API и БД.
 */
export interface StepTypeDef {
  /** Значение content.type */
  id: string
  /** Kind на бэкенде — определяет механизм проверки */
  kind: StepKind
  label: string
  /** Для админа: когда использовать */
  description: string
  icon: string
  /** Цвет плашки (из step.* палитры) */
  color: string
  check: CheckMode
  defaultMaxScore: number
  defaultContent: () => StepContent
  Editor: FC<EditorProps>
  Player: FC<PlayerProps>
  /** Как куратор видит ответ ученика; по умолчанию — текст + ссылка */
  ReviewView?: FC<ReviewViewProps>
  /** Проверка контента перед сохранением; возвращает текст ошибки */
  validate?: (content: StepContent) => string | null
}
