import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Icon, type IconName } from './Icon'


export function ProgressBar({ value, className, tone = 'blue' }: { value: number; className?: string; tone?: 'blue' | 'done' }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-brand-line', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-all duration-500', tone === 'done' ? 'bg-st-done' : 'bg-brand-blue')} style={{ width: `${v}%` }} />
    </div>
  )
}


export function SegmentBar({ segments, total, className }: { segments: { value: number; className: string; label: string }[]; total: number; className?: string }) {
  const sum = Math.max(total, segments.reduce((a, s) => a + s.value, 0), 1)
  return (
    <div className={cx('flex h-3 gap-0.5 overflow-hidden rounded-full bg-brand-line', className)} role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div key={s.label} className={cx('h-full first:rounded-l-full last:rounded-r-full', s.className)} style={{ width: `${(s.value / sum) * 100}%` }} />
        ))}
    </div>
  )
}


export function Badge({ children, className, icon }: { children: ReactNode; className?: string; icon?: IconName }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap', className ?? 'bg-st-idle-bg text-st-idle')}>
      {icon && <Icon name={icon} size={14} strokeWidth={2.2} />}
      {children}
    </span>
  )
}


export function ScorePill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('num inline-flex items-center rounded-full bg-brand-blue-50 px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap text-brand-blue', className)}>{children}</span>
}


export function Dot({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap', className)}>
      <span className="size-2 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  )
}
