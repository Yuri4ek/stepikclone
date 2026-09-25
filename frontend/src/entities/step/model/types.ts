import type { FC } from 'react'
import type { Answers, LearningStep, StepContent, StepKind } from '@/shared/api'
import type { IconName } from '@/shared/ui'

/** none — при прочтении, auto — ответ проверяется сразу, tests — прогон по тестам на сервере, manual — куратор */
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
 * Описание типа шага. Бэкенд знает механизмы проверки (`kind`: theory/quiz/task/code, реестр
 * app/steps/registry.py) и хранит произвольный JSON в `content`. Тип шага на платформе — это `content.type`
 * + механизм проверки, поэтому новый тип (например, «Робототехника») добавляется одним модулем без изменения API и БД.
 */
export interface StepTypeDef {
  /** Значение content.type */
  id: string
  /** Kind на бэкенде — определяет механизм проверки */
  kind: StepKind
  label: string
  /** Для админа: когда использовать */
  description: string
  /** Линейная иконка 24 px; отдельный цвет типу не нужен (брендбук, раздел 05) */
  icon: IconName
  check: CheckMode
  defaultMaxScore: number
  defaultContent: () => StepContent
  Editor: FC<EditorProps>
  Player: FC<PlayerProps>
  /** Короткое пояснение в выборе типа: из какого раздела пакета содержания */
  group?: string
  /** Как куратор видит ответ ученика; по умолчанию — текст, ссылка и скриншот */
  ReviewView?: FC<ReviewViewProps>
  /** Проверка контента перед сохранением; возвращает текст ошибки */
  validate?: (content: StepContent) => string | null
}
