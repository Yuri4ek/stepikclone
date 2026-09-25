import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { Icon, type IconName } from './Icon'

/** Карточка: белая, рамка «Линия», радиус 16 */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-card border border-brand-line bg-white', className)}>{children}</div>
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-sm text-brand-ink-2">{eyebrow}</div>}
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-brand-ink sm:text-[32px]">{title}</h1>
        {subtitle && <div className="mt-2 text-brand-ink-2">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-brand-line bg-white px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-btn bg-brand-blue-50 text-brand-blue">
        <Icon name={icon} size={24} />
      </div>
      <div className="mt-4 font-semibold">{title}</div>
      {children && <div className="mt-1 text-sm text-brand-ink-2">{children}</div>}
    </div>
  )
}

/** Список строк без разделителей: подсветка при наведении */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-0.5 p-2', className)}>{children}</div>
}

/** Заголовок секции капсом, как в брендбуке */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('eyebrow mb-3 text-brand-ink-3', className)}>{children}</div>
}
