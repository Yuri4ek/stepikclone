import type { StepTypeDef } from '../steps/types'
import { cx } from './ui'

export function StepTypeBadge({ type, className }: { type: StepTypeDef; className?: string }) {
  return (
    <span
      className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', className)}
      style={{ backgroundColor: `${type.color}1F`, color: type.color }}
    >
      <span aria-hidden>{type.icon}</span>
      {type.label}
    </span>
  )
}

export function StepTypeIcon({ type, size = 'md' }: { type: StepTypeDef; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center', size === 'sm' ? 'size-9 rounded-xl text-base' : 'size-12 rounded-2xl text-xl')}
      style={{ backgroundImage: `linear-gradient(135deg, ${type.color}33, ${type.color}14)`, color: type.color }}
      aria-hidden
    >
      {type.icon}
    </span>
  )
}
