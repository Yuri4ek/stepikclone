import type { Role } from '@/shared/api'
import { cx } from '@/shared/lib'
import { roleMeta } from '../model/roleMeta'

export function Avatar({ name, role, size = 'md' }: { name: string; role: Role; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cx('flex shrink-0 items-center justify-center rounded-full font-medium text-white shadow-md', size === 'lg' ? 'size-20 text-3xl' : 'size-10 text-sm')}
      style={{ backgroundImage: roleMeta[role].gradient }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  )
}
