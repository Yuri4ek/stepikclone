import type { IconName } from './Icon'

/**
 * Шесть статусов брендбука (раздел 03). У каждого — своя пара «цвет + иконка»,
 * одним цветом статус не обозначаем: так его различат и дальтоники.
 */
export type StatusTone = 'done' | 'review' | 'returned' | 'failed' | 'progress' | 'idle'

export const statusTone: Record<StatusTone, { label: string; icon: IconName; badge: string; node: string; text: string }> = {
  done: { label: 'Зачтено', icon: 'check', badge: 'bg-st-done-bg text-st-done', node: 'bg-st-done text-white', text: 'text-st-done' },
  review: { label: 'На проверке', icon: 'clock', badge: 'bg-st-review-bg text-st-review', node: 'bg-white text-st-review ring-2 ring-inset ring-st-review', text: 'text-st-review' },
  returned: { label: 'Возвращено', icon: 'undo', badge: 'bg-st-returned-bg text-st-returned', node: 'bg-st-returned-bg text-st-returned ring-2 ring-inset ring-brand-amber', text: 'text-st-returned' },
  failed: { label: 'Не прошло тесты', icon: 'x', badge: 'bg-st-failed-bg text-st-failed', node: 'bg-st-failed-bg text-st-failed ring-2 ring-inset ring-st-failed', text: 'text-st-failed' },
  progress: { label: 'В процессе', icon: 'play', badge: 'bg-st-progress-bg text-st-progress', node: 'bg-brand-blue-50 text-brand-blue ring-2 ring-inset ring-brand-blue-200', text: 'text-st-progress' },
  idle: { label: 'Не начато', icon: 'lock', badge: 'bg-st-idle-bg text-st-idle', node: 'bg-st-idle-bg text-brand-ink-3', text: 'text-st-idle' },
}
