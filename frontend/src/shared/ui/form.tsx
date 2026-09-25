import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx } from '../lib/cx'

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-brand-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-brand-ink-2">{hint}</span>}
    </label>
  )
}

// Поле: радиус 8, рамка «Линия», фокус — синий
const inputCls =
  'w-full rounded-field border border-brand-line bg-white px-3.5 py-2.5 text-[length:inherit] text-brand-ink placeholder:text-brand-ink-3 transition-colors hover:border-brand-blue-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-50 focus:outline-none disabled:bg-brand-mist disabled:text-brand-ink-2'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, 'min-h-24', props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, 'cursor-pointer pr-9', props.className)} />
}


export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div className={cx('inline-flex flex-wrap rounded-btn bg-st-idle-bg p-1 text-sm', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx('rounded-[9px] px-3 py-1.5 font-semibold transition-colors', value === o.value ? 'bg-white text-brand-blue shadow-sm' : 'text-brand-ink-2 hover:text-brand-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
