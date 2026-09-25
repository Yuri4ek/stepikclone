import type { CSSProperties } from 'react'
import { mediaUrl } from '@/shared/api'
import type { IconName } from '@/shared/ui'

// Обложки по умолчанию — плоские цвета бренда (градиенты на карточках брендбук запрещает)
const COVERS = ['#3457F0', '#0B1220', '#2641C9', '#131C30']

export function courseCover(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COVERS[h % COVERS.length]
}


export function courseCoverStyle(course: { id: string; cover_url?: string | null }): CSSProperties {
  const url = mediaUrl(course.cover_url)
  if (!url) return { backgroundColor: courseCover(course.id) }
  return {
    backgroundColor: '#0B1220',
    backgroundImage: `linear-gradient(rgb(11 18 32 / 0.45), rgb(11 18 32 / 0.45)), url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}


export function courseIcon(course: { title: string; passport?: { tool?: string } | null }): IconName {
  const t = `${course.passport?.tool ?? ''} ${course.title}`.toLowerCase()
  if (t.includes('scratch')) return 'blocks'
  if (t.includes('minecraft')) return 'cube'
  return 'code'
}
