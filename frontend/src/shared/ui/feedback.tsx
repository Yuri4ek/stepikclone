import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Button } from './Button'

export function Spinner({ className = 'size-6' }: { className?: string }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Loader({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-brand">
      <Spinner />
      <span className="text-content-secondary">{label}</span>
    </div>
  )
}

export function ErrorBox({ error, onRetry }: { error: Error | string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-status-error/10 px-5 py-3.5 text-sm text-red-700">
      <span>{typeof error === 'string' ? error : error.message}</span>
      {onRetry && (
        <Button size="sm" variant="danger" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  )
}

export function Notice({ tone = 'info', children, className }: { tone?: 'info' | 'success' | 'warning' | 'error'; children: ReactNode; className?: string }) {
  const tones = {
    info: 'bg-brand/10 text-brand-deep',
    success: 'bg-emerald-500/12 text-emerald-800',
    warning: 'bg-amber-400/15 text-amber-800',
    error: 'bg-status-error/10 text-red-800',
  }
  return <div className={cx('rounded-2xl px-5 py-4 text-sm', tones[tone], className)}>{children}</div>
}
