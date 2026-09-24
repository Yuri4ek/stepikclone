import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

/** Карточка без рамок. accent — цвет мягкой подсветки (тип шага, роль, статус) */
export function Card({ className, children, accent }: { className?: string; children: ReactNode; accent?: string }) {
  return (
    <div className={cx('glass rounded-[28px]', className)} style={accent ? { backgroundImage: `linear-gradient(135deg, ${accent}1F 0%, ${accent}08 35%, transparent 70%)` } : undefined}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-sm text-content-secondary">{eyebrow}</div>}
        <h1 className="text-3xl font-medium tracking-tight text-content-primary sm:text-4xl">{title}</h1>
        {subtitle && <div className="mt-2 text-content-secondary">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon = '📭', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="glass rounded-[28px] px-6 py-14 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand/10 text-3xl">{icon}</div>
      <div className="mt-4 text-lg font-medium">{title}</div>
      {children && <div className="mt-1 text-sm text-content-secondary">{children}</div>}
    </div>
  )
}

/** Список без линий-разделителей: строки разделены отступом и подсвечиваются при наведении */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-1 p-2', className)}>{children}</div>
}
