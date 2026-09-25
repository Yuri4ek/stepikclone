import type { CoursePassport } from '@/shared/api'
import { Card, Icon, type IconName } from '@/shared/ui'

const rows: { key: keyof CoursePassport; label: string; icon: IconName }[] = [
  { key: 'grades', label: 'Классы', icon: 'users' },
  { key: 'volume', label: 'Объём', icon: 'clock' },
  { key: 'tool', label: 'Инструмент', icon: 'settings' },
]


export function CoursePassportCard({ passport, className }: { passport: CoursePassport | null | undefined; className?: string }) {
  if (!passport || !Object.values(passport).some(Boolean)) return null
  return (
    <Card className={className}>
      <div className="p-5">
        <div className="eyebrow text-brand-ink-3">Паспорт курса</div>
        <dl className="mt-3 space-y-3 text-sm">
          {rows
            .filter((r) => passport[r.key])
            .map((r) => (
              <div key={r.key} className="flex gap-3">
                <Icon name={r.icon} size={18} className="mt-0.5 shrink-0 text-brand-blue" />
                <div>
                  <dt className="text-brand-ink-3">{r.label}</dt>
                  <dd className="font-semibold">{passport[r.key]}</dd>
                </div>
              </div>
            ))}
        </dl>
      </div>
    </Card>
  )
}
