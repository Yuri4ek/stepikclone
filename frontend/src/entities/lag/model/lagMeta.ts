import type { LagLevel } from '@/shared/api'

/**
 * Три уровня отставания для куратора (брендбук, раздел 03). Уровень считает бэкенд (app/slices/lag):
 * кроме «давно не заходил» он ловит ранние сигналы — заходит, но не продвигается; застрял на шаге;
 * не исправляет возвращённую работу; отстаёт от группы. Так куратор видит проблему раньше, чем ученик пропадёт.
 */
export type LagState = LagLevel

export const lagMeta: Record<LagState, { label: string; cls: string; hint: string }> = {
  ok: { label: 'В графике', cls: 'text-st-done', hint: 'Занимается, тревожных сигналов нет' },
  warning: { label: 'Замедлился', cls: 'text-brand-amber-text', hint: '3+ дня без входа, 4+ дня без продвижения, застрял на шаге или отстаёт от группы' },
  critical: { label: 'Выпадает', cls: 'text-st-failed', hint: '7+ дней без входа, 10+ дней без продвижения или несколько сигналов сразу' },
}
