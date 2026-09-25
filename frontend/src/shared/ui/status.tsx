import { Badge } from './badges'
import { statusTone, type StatusTone } from './statusMeta'


export function StatusPill({ tone, checkedBy, label }: { tone: StatusTone; checkedBy?: 'manual' | 'auto' | null; label?: string }) {
  const t = statusTone[tone]
  const badge = (
    <Badge icon={t.icon} className={t.badge}>
      {label ?? t.label}
    </Badge>
  )
  if (!checkedBy) return badge
  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      {badge}
      <span className="pl-1 text-xs text-brand-ink-3">{checkedBy === 'manual' ? 'проверил куратор' : 'проверено автоматически'}</span>
    </span>
  )
}
