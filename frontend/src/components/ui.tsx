import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import type { Role, StepStatus } from '../api'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

// ---------- Button ----------

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

// ---------- Layout primitives ----------

/** Карточка без рамок. accent — цвет мягкой подсветки (тип шага, роль, статус) */
export function Card({ className, children, accent }: { className?: string; children: ReactNode; accent?: string }) {
  return (
    <div className={cx('glass rounded-[28px]', className)} style={accent ? { backgroundImage: `linear-gradient(135deg, ${accent}1F 0%, ${accent}08 35%, transparent 70%)` } : undefined}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-sm text-content-secondary">{eyebrow}</div>}
        <h1 className="text-3xl font-medium tracking-tight text-content-primary sm:text-4xl">{title}</h1>
        {subtitle && <div className="mt-2 text-content-secondary">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

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

export function EmptyState({ icon = '📭', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="glass rounded-[28px] px-6 py-14 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10 text-3xl">{icon}</div>
      <div className="mt-4 text-lg font-medium">{title}</div>
      {children && <div className="mt-1 text-sm text-content-secondary">{children}</div>}
    </div>
  )
}

/** Список без линий-разделителей: строки разделены отступом и подсвечиваются при наведении */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-1 p-2', className)}>{children}</div>
}

// ---------- Progress & badges ----------

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

export const stepStatusMeta: Record<StepStatus, { label: string; color: string; icon: string }> = {
  locked: { label: 'Закрыт', color: '#94A3B8', icon: '🔒' },
  available: { label: 'Доступен', color: '#3D5AFE', icon: '•' },
  in_progress: { label: 'В процессе', color: '#3D5AFE', icon: '…' },
  submitted: { label: 'На проверке', color: '#D97706', icon: '⏳' },
  returned: { label: 'Возвращено', color: '#EF4444', icon: '↩' },
  passed: { label: 'Пройден', color: '#059669', icon: '✓' },
  failed: { label: 'Не засчитан', color: '#EF4444', icon: '✕' },
}

export function StatusBadge({ status }: { status: StepStatus }) {
  const m = stepStatusMeta[status]
  return <Badge color={m.color}>{m.label}</Badge>
}

export const roleMeta: Record<Role, { label: string; color: string; cabinet: string; gradient: string }> = {
  student: { label: 'Ученик', color: '#3D5AFE', cabinet: 'Кабинет ученика', gradient: 'linear-gradient(135deg,#3D5AFE,#40C4FF)' },
  curator: { label: 'Куратор', color: '#0EA5E9', cabinet: 'Кабинет куратора', gradient: 'linear-gradient(135deg,#0EA5E9,#7C4DFF)' },
  admin: { label: 'Администратор', color: '#7C3AED', cabinet: 'Кабинет администратора', gradient: 'linear-gradient(135deg,#7C3AED,#C026D3)' },
}

export function RoleBadge({ role }: { role: Role }) {
  const m = roleMeta[role]
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundImage: m.gradient }}>
      {m.label}
    </span>
  )
}

export function Avatar({ name, role, size = 'md' }: { name: string; role: Role; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center rounded-full font-medium text-white shadow-md', size === 'lg' ? 'size-20 text-3xl' : 'size-10 text-sm')}
      style={{ backgroundImage: roleMeta[role].gradient }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  )
}

// ---------- Form ----------

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-content-primary">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-content-secondary">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-2xl border-0 bg-brand/[0.06] px-4 py-3 text-sm text-content-primary placeholder:text-content-secondary/60 transition-colors hover:bg-brand/[0.09] focus:bg-white focus:ring-2 focus:ring-brand/40 focus:outline-none disabled:opacity-60'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, 'min-h-24', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, 'cursor-pointer pr-9', props.className)} />
}

/** Сегментированный переключатель (как вкладки в Material / Т-Банк) */
export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div className={cx('inline-flex rounded-full bg-brand/[0.08] p-1 text-sm', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx('rounded-full px-3.5 py-1.5 font-medium transition-all', value === o.value ? 'bg-white text-brand shadow-sm' : 'text-content-secondary hover:text-brand')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
