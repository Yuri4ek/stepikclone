import { useState } from 'react'
import { cx } from '../lib/cx'
import { Button } from './Button'
import { Input } from './form'

/** Поле ввода, которое появляется по кнопке: для добавления модуля / урока */
export function InlineAdd({ label, placeholder, onAdd, small }: { label: string; placeholder: string; onAdd: (title: string) => Promise<void>; small?: boolean }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className={cx('w-full rounded-full bg-brand/6 text-left font-medium text-brand transition-colors hover:bg-brand/12', small ? 'px-4 py-2 text-xs' : 'px-5 py-3 text-sm')}>
        + {label}
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
      <Button type="submit" size="sm" loading={busy}>
        OK
      </Button>
    </form>
  )
}
