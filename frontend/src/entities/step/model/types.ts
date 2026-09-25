import type { FC } from 'react'
import type { Answers, LearningStep, StepContent, StepKind } from '@/shared/api'
import type { IconName } from '@/shared/ui'


export type CheckMode = 'none' | 'auto' | 'tests' | 'manual'

export interface EditorProps {
  content: StepContent
  onChange: (content: StepContent) => void
}

export interface PlayerProps {
  step: LearningStep
  content: StepContent

  busy: boolean

  canSubmit: boolean
  submit: (answers: Answers) => void
  complete: () => void
}

export interface ReviewViewProps {
  payload: Answers
  content: StepContent
}


export interface StepTypeDef {

  id: string

  kind: StepKind
  label: string

  description: string

  icon: IconName
  check: CheckMode
  defaultMaxScore: number
  defaultContent: () => StepContent
  Editor: FC<EditorProps>
  Player: FC<PlayerProps>

  group?: string

  ReviewView?: FC<ReviewViewProps>

  validate?: (content: StepContent) => string | null
}
