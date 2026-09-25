import { STEP_TYPES, StepTypeIcon, checkLabels, type StepTypeDef } from '@/entities/step'
import { Button, Card, Icon } from '@/shared/ui'

export function TypePicker({ onPick, onCancel }: { onPick: (t: StepTypeDef) => void; onCancel: () => void }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Выберите тип шага</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {STEP_TYPES.map((t) => (
          <button key={t.id} onClick={() => onPick(t)} className="flex gap-4 rounded-card border border-brand-line bg-white p-4 text-left transition-colors hover:border-brand-blue-200 hover:bg-brand-blue-50">
            <StepTypeIcon type={t} />
            <span>
              <span className="block font-bold">{t.label}</span>
              <span className="mt-0.5 block text-sm text-brand-ink-2">{t.description}</span>
              <span className="eyebrow mt-2 inline-block text-brand-ink-3">{checkLabels[t.check]}</span>
            </span>
          </button>
        ))}
        <div className="flex gap-4 rounded-card border border-dashed border-brand-line p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-btn bg-st-idle-bg text-brand-ink-3">
            <Icon name="plus" size={24} />
          </span>
          <span>
            <span className="block font-bold">Новый тип</span>
            <span className="mt-0.5 block text-sm text-brand-ink-2">
              Добавляется одним модулем в <code className="font-mono text-xs">entities/step/ui/step-types</code> и строкой в реестре — без изменения API и базы.
            </span>
          </span>
        </div>
      </div>
    </Card>
  )
}
