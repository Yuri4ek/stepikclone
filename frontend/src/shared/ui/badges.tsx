import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('h-2 overflow-hidden rounded-full bg-brand/10', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-all duration-500', color ?? 'bg-brand-gradient')} style={{ width: `${v}%` }} />
    </div>
  )
}

export function Badge({ children, className, color }: { children: ReactNode; className?: string; color?: string }) {
  return (
    <span
      className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', className)}
      style={color ? { backgroundColor: `${color}1F`, color } : undefined}
    >
      {children}
    </span>
  )
}

/** Баллы и рейтинг — всегда золотом */
export function ScorePill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300/30 to-amber-400/25 px-2.5 py-1 text-xs font-bold text-amber-700', className)}>
      <span aria-hidden>★</span>
      {children}
    </span>
  )
}
