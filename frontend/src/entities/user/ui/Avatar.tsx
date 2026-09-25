import type { Role } from '@/shared/api'
import { cx } from '@/shared/lib'


export function Avatar({ name, size = 'md' }: { name: string; role?: Role; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center rounded-full bg-brand-blue-50 font-bold text-brand-blue', size === 'lg' ? 'size-20 text-2xl' : size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm')}
      aria-hidden
    >
      {initials}
    </span>
  )
}
