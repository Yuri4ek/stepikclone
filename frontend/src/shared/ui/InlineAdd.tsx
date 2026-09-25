import { useState } from 'react'
import { cx } from '../lib/cx'
import { Button } from './Button'
import { Input } from './form'
import { Icon } from './Icon'

/** Поле ввода, которое появляется по кнопке: для добавления модуля / урока */
export function InlineAdd({ label, placeholder, onAdd, small }: { label: string; placeholder: string; onAdd: (title: string) => Promise<void>; small?: boolean }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className={cx('flex w-full items-center gap-1.5 rounded-btn border border-dashed border-brand-line text-left font-semibold text-brand-blue transition-colors hover:border-brand-blue-200 hover:bg-brand-blue-50', small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm')}
      >
        <Icon name="plus" size={small ? 14 : 16} />
        {label}
      </button>
    )
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!value.trim()) return
        setBusy(true)
        try {
          await onAdd(value.trim())
          setValue('')
          setOpen(false)
        } finally {
          setBusy(false)
        }
      }}
    >
      <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
      <Button type="submit" size="sm" loading={busy} className="h-auto">
        OK
      </Button>
    </form>
  )
}
