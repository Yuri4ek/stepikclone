import type { LagLevel } from '@/shared/api'

/**
 * Три уровня отставания для куратора (брендбук, раздел 03).
 * API отдаёт только отстающих (warning / critical); остальные ученики — «В графике».
 * Пороги задаёт бэкенд: warning — 3+ дня без активности или прогресс < 20 %, critical — 7+ дней.
 */
export type LagState = 'ok' | LagLevel

export const lagMeta: Record<LagState, { label: string; cls: string; hint: string }> = {
  ok: { label: 'В графике', cls: 'text-st-done', hint: 'Заходит регулярно' },
  warning: { label: 'Замедлился', cls: 'text-brand-amber-text', hint: 'Нет активности 3+ дня или прогресс ниже 20 %' },
  critical: { label: 'Выпадает', cls: 'text-st-failed', hint: 'Нет активности 7+ дней' },
}
