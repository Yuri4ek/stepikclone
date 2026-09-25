import { Link } from 'react-router-dom'
import { BRAND } from '../config'
import { cx } from '../lib/cx'
import { Icon } from './Icon'

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand-blue text-white">
        <Icon name="code" size={20} strokeWidth={2.2} />
      </span>
      <span className="leading-tight">
        <span className={cx('block text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-brand-ink')}>
          {BRAND}
          <span className="text-brand-sky">.</span>
        </span>
        <span className={cx('block text-[11px] font-medium', light ? 'text-white/60' : 'text-brand-ink-3')}>ФСП Чувашской Республики</span>
      </span>
    </Link>
  )
}
