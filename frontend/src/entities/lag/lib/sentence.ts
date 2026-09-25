import type { LagItem } from '@/shared/api'

/** Главная причина отставания одной строкой — по-деловому, без канцелярита (брендбук, раздел 07) */
export function lagSentence(it: Pick<LagItem, 'reason' | 'current_step_title' | 'signals'>) {
  if (!it.signals.length) return it.reason
  return it.current_step_title && it.signals[0].code === 'inactive' ? `${it.reason}, последний шаг «${it.current_step_title}»` : it.reason
}
