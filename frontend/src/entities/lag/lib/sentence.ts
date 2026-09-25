import type { LagItem } from '@/shared/api'
import { plural } from '@/shared/lib'

/** «6 дней без входа, последний шаг «Итоговый проект»» — по-деловому, без канцелярита (брендбук, раздел 07) */
export function lagSentence(it: Pick<LagItem, 'days_since_activity' | 'current_step_title'>) {
  const days = `${it.days_since_activity} ${plural(it.days_since_activity, 'день', 'дня', 'дней')} без входа`
  return it.current_step_title ? `${days}, последний шаг «${it.current_step_title}»` : days
}
