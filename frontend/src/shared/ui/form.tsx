import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx } from '../lib/cx'

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
