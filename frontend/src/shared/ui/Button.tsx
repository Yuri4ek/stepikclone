import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../lib/cx'
import { Spinner } from './feedback'

/**
 * Кнопки по брендбуку (раздел 06): главная — синяя, вторичная — белая с рамкой,
 * ссылка — синий текст, «Вернуть с комментарием» — янтарная рамка, закрытый шаг — туман.
 * Градиентов на кнопках нет.
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'amber' | 'danger' | 'dark'
const variants: Record<Variant, string> = {
  primary: 'bg-brand-blue text-white hover:bg-brand-blue-hover disabled:bg-st-idle-bg disabled:text-brand-ink-3',
  secondary: 'border border-brand-line bg-white text-brand-ink hover:border-brand-blue-200 hover:bg-brand-blue-50 disabled:text-brand-ink-3',
  ghost: 'text-brand-blue hover:bg-brand-blue-50 disabled:text-brand-ink-3',
  amber: 'border border-brand-amber/40 bg-white text-brand-amber-text hover:bg-brand-amber-50 disabled:opacity-50',
  danger: 'text-st-failed hover:bg-st-failed-bg disabled:opacity-50',
  dark: 'bg-white text-brand-night hover:bg-brand-blue-50',
}

// md — высота из роли: 56 у ученика, 40 у куратора и администратора (переменная --btn-h из tokens.css)
const sizes = {
  sm: 'h-9 px-3 text-sm rounded-[10px]',
  md: 'h-[var(--btn-h,44px)] px-5 text-[length:inherit] rounded-[var(--r-btn)]',
  lg: 'h-14 px-7 text-lg rounded-[14px]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: keyof typeof sizes
  loading?: boolean
}

const btnBase =
  'inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed'

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button {...rest} disabled={disabled || loading} className={cx(btnBase, sizes[size], variants[variant], className)}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}

export function ButtonLink({ to, variant = 'primary', size = 'md', className, children }: { to: string; variant?: Variant; size?: keyof typeof sizes; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={cx(btnBase, sizes[size], variants[variant], className)}>
      {children}
    </Link>
  )
}
