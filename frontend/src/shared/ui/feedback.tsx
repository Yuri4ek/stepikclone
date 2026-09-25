import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Button } from './Button'
import { Icon } from './Icon'

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
    <div className="flex items-center justify-center gap-3 py-20 text-brand-blue">
      <Spinner />
      <span className="text-brand-ink-2">{label}</span>
    </div>
  )
}

export function ErrorBox({ error, onRetry }: { error: Error | string; onRetry?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-brand-line bg-white px-5 py-4 text-sm">
      <span className="flex items-center gap-2 text-brand-ink">
        <Icon name="alert" className="shrink-0 text-brand-amber-text" />
        {typeof error === 'string' ? error : error.message}
      </span>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  )
}

/**
 * Подсказки и сообщения. Красный тон — только для «Не прошло тесты» (брендбук, раздел 09),
 * на янтарном фоне текст цвета «Ночь».
 */
const tones = {
  info: 'border-brand-blue-200 bg-brand-blue-50 text-brand-ink',
  success: 'border-st-done/20 bg-st-done-bg text-brand-ink',
  warning: 'border-brand-amber/30 bg-brand-amber-50 text-brand-night',
  review: 'border-st-review/20 bg-st-review-bg text-brand-ink',
  error: 'border-st-failed/20 bg-st-failed-bg text-brand-ink',
}

export function Notice({ tone = 'info', children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return <div className={cx('rounded-card border px-5 py-4 text-sm', tones[tone], className)}>{children}</div>
}
