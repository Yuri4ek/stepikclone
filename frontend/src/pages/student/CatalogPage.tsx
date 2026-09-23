import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type CatalogCourse } from '../../api'
import { useUser } from '../../auth/AuthContext'
import { formatPercent } from '../../lib/format'
import { useAsync } from '../../lib/useAsync'
import { Button, ButtonLink, Card, EmptyState, ErrorBox, Loader, PageHeader, ProgressBar, ScorePill } from '../../components/ui'

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

export function CourseCard({ course, onEnrolled }: { course: CatalogCourse; onEnrolled?: () => void }) {
  const user = useUser()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Error>()
  const e = course.enrollment
  const cover = courseCover(course.id)

  const enroll = async () => {
    setBusy(true)
    setError(undefined)
    try {
      await api.catalog.enroll(course.id)
      onEnrolled?.()
      navigate(`/courses/${course.id}`)
    } catch (err) {
      setError(err as Error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative m-2 h-32 overflow-hidden rounded-[22px] p-5 text-white" style={{ backgroundImage: cover }}>
        <div className="absolute -right-8 -bottom-12 size-40 rounded-full bg-white/20 blur-2xl" aria-hidden />
        <div className="relative font-mono text-3xl font-medium opacity-90">{'{ }'}</div>
        {e && <span className="absolute top-4 right-4 rounded-full bg-white/25 px-3 py-1 text-xs font-medium backdrop-blur">Вы записаны</span>}
      </div>
      <div className="flex flex-1 flex-col px-5 pt-3 pb-5">
        <h3 className="text-lg leading-snug font-medium">{course.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-content-secondary">{course.description || 'Описание скоро появится'}</p>
        {e && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-content-secondary">Пройдено {formatPercent(e.percent)}</span>
              <ScorePill>{Math.round(e.rating_score)} рейтинг</ScorePill>
            </div>
            <ProgressBar value={e.percent} />
          </div>
        )}
        {error && <div className="mt-3"><ErrorBox error={error} /></div>}
        <div className="mt-4 flex gap-2">
          {e ? (
            <ButtonLink to={`/courses/${course.id}`} className="flex-1">
              Продолжить
            </ButtonLink>
          ) : user.role === 'student' ? (
            <>
              <Button onClick={enroll} loading={busy} className="flex-1">
                Записаться
              </Button>
              <ButtonLink to={`/courses/${course.id}`} variant="secondary">
                Программа
              </ButtonLink>
            </>
          ) : (
            <ButtonLink to={`/courses/${course.id}`} variant="secondary" className="flex-1">
              Программа курса
            </ButtonLink>
          )}
        </div>
      </div>
    </Card>
  )
}

export function CatalogPage() {
  const { data, error, loading, reload } = useAsync(() => api.catalog.courses(), [])
  return (
    <>
      <PageHeader title="Каталог курсов" subtitle="Программы подготовки по спортивному программированию для 1–9 классов" />
      {loading && !data && <Loader />}
      {error && <ErrorBox error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="Опубликованных курсов пока нет" />}
      {data && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((c) => (
            <CourseCard key={c.id} course={c} onEnrolled={reload} />
          ))}
        </div>
      )}
    </>
  )
}
