import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../lib/cx'
import { Spinner } from './feedback'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
const variants: Record<Variant, string> = {
  primary: 'bg-brand-gradient text-white shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand-violet/30 hover:brightness-110 disabled:opacity-50 disabled:shadow-none',
  secondary: 'bg-brand/10 text-brand hover:bg-brand/15 disabled:opacity-50',
  ghost: 'text-content-secondary hover:bg-brand/8 hover:text-brand disabled:opacity-50',
  danger: 'bg-status-error/10 text-status-error hover:bg-status-error/15 disabled:opacity-50',
  success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 disabled:opacity-50 disabled:shadow-none',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  loading?: boolean
}

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-violet disabled:cursor-not-allowed disabled:active:scale-100'

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button {...rest} disabled={disabled || loading} className={cx(btnBase, size === 'sm' ? 'px-3.5 py-1.5 text-sm' : 'px-5 py-2.5 text-sm', variants[variant], className)}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}

export function ButtonLink({ to, variant = 'primary', className, children }: { to: string; variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={cx(btnBase, 'px-5 py-2.5 text-sm', variants[variant], className)}>
      {children}
    </Link>
  )
}
