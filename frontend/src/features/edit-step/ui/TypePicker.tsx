import { STEP_TYPES, StepTypeIcon, checkLabels, type StepTypeDef } from '@/entities/step'
import { Button, Card } from '@/shared/ui'

export function TypePicker({ onPick, onCancel }: { onPick: (t: StepTypeDef) => void; onCancel: () => void }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Выберите тип шага</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {STEP_TYPES.map((t) => (
          <button key={t.id} onClick={() => onPick(t)} className="flex gap-4 rounded-3xl p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ color: t.color, backgroundImage: `linear-gradient(135deg, ${t.color}1F, ${t.color}08)` }}>
            <StepTypeIcon type={t} />
            <span className="text-content-primary">
              <span className="block font-medium">{t.label}</span>
              <span className="mt-0.5 block text-xs text-content-secondary">{t.description}</span>
              <span className="mt-2 inline-block text-xs font-medium" style={{ color: t.color }}>
                {checkLabels[t.check]}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-content-secondary">
        Новые типы шагов добавляются одним модулем в <code>src/entities/step/ui/step-types</code> без изменения API и базы данных.
      </p>
    </Card>
  )
}
