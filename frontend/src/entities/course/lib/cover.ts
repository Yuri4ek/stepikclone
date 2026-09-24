import type { CSSProperties } from 'react'
import { mediaUrl } from '@/shared/api'

// Обложки курсов по умолчанию — оттенки синего и фиолетового
const COVERS = [
  'linear-gradient(135deg,#3D5AFE,#40C4FF)',
  'linear-gradient(135deg,#7C4DFF,#3D5AFE)',
  'linear-gradient(135deg,#6366F1,#A855F7)',
  'linear-gradient(135deg,#2563EB,#7C3AED)',
  'linear-gradient(135deg,#8B5CF6,#EC4899)',
  'linear-gradient(135deg,#0EA5E9,#6366F1)',
]

export function courseCover(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COVERS[h % COVERS.length]
}

/** Фон обложки: загруженная картинка (с затемнением под белый текст) или градиент */
export function courseCoverStyle(course: { id: string; cover_url?: string | null }): CSSProperties {
  const url = mediaUrl(course.cover_url)
  if (!url) return { backgroundImage: courseCover(course.id) }
  return {
    backgroundImage: `linear-gradient(135deg, rgb(27 30 63 / 0.55), rgb(61 90 254 / 0.25)), url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}
