import { Link } from 'react-router-dom'
import { BRAND } from '../config'
import { cx } from '../lib/cx'

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className={cx('relative flex size-10 items-center justify-center rounded-2xl font-mono text-sm font-medium text-white shadow-lg', light ? 'bg-white/20 shadow-none' : 'bg-brand-gradient shadow-brand/30')}>
        {'</>'}
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rotate-45 rounded-[3px] bg-brand-crimson ring-2 ring-white" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className={cx('block text-lg font-medium tracking-tight', light ? 'text-white' : 'text-content-primary')}>{BRAND}</span>
        <span className={cx('block text-[11px]', light ? 'text-white/70' : 'text-content-secondary')}>
          Спортивное программирование · <span className={light ? 'text-white' : 'text-brand-crimson'}>Чувашия</span>
        </span>
      </span>
    </Link>
  )
}
