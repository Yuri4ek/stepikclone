import { cx } from '@/shared/lib'
import { Icon } from '@/shared/ui'
import type { StepTypeDef } from '../model/types'


export function StepTypeBadge({ type, className }: { type: StepTypeDef; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-brand-ink-2', className)}>
      <Icon name={type.icon} size={16} className="text-brand-blue" />
      {type.label}
    </span>
  )
}


export function StepTypeIcon({ type, size = 'md' }: { type: StepTypeDef; size?: 'sm' | 'md' }) {
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center bg-brand-blue-50 text-brand-blue', size === 'sm' ? 'size-9 rounded-[10px]' : 'size-12 rounded-btn')} aria-hidden>
      <Icon name={type.icon} size={size === 'sm' ? 18 : 24} />
    </span>
  )
}
