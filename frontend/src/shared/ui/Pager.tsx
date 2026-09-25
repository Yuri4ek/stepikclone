import { Button } from './Button'
import { Icon } from './Icon'

export function Pager({ total, limit, offset, onChange }: { total: number; limit: number; offset: number; onChange: (offset: number) => void }) {
  if (total <= limit) return null
  const page = Math.floor(offset / limit) + 1
  const pages = Math.ceil(total / limit)
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <Button size="sm" variant="secondary" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))} aria-label="Назад">
        <Icon name="arrowLeft" size={16} />
      </Button>
      <span className="num">
        {page} из {pages}
      </span>
      <Button size="sm" variant="secondary" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)} aria-label="Вперёд">
        <Icon name="arrowRight" size={16} />
      </Button>
    </div>
  )
}
