import type { CourseStatus } from '@/shared/api'
import type { IconName } from '@/shared/ui'

export const courseStatusMeta: Record<CourseStatus, { label: string; cls: string; icon: IconName }> = {
  draft: { label: 'Черновик', cls: 'bg-st-idle-bg text-st-idle', icon: 'settings' },
  published: { label: 'Опубликован', cls: 'bg-st-done-bg text-st-done', icon: 'check' },
}
