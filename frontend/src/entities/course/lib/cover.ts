// Обложки курсов — оттенки синего и фиолетового
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
