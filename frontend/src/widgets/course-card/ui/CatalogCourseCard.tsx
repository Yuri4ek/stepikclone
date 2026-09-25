import { useNavigate } from 'react-router-dom'
import { CourseCard } from '@/entities/course'
import { useUser } from '@/entities/session'
import { useEnrollCourse } from '@/features/enroll-course'
import type { CatalogCourse } from '@/shared/api'
import { Button, ButtonLink, ErrorBox, Icon } from '@/shared/ui'


export function CatalogCourseCard({ course, onEnrolled }: { course: CatalogCourse; onEnrolled?: () => void }) {
  const user = useUser()
  const navigate = useNavigate()
  const { enroll, busy, error } = useEnrollCourse(course.id, () => {
    onEnrolled?.()
    navigate(`/courses/${course.id}`)
  })

  return (
    <CourseCard
      course={course}
      footer={
        error && (
          <div className="mt-3">
            <ErrorBox error={error} />
          </div>
        )
      }
      actions={
        course.enrollment ? (
          <ButtonLink to={`/courses/${course.id}`} className="flex-1">
            Продолжить
            <Icon name="arrowRight" size={18} />
          </ButtonLink>
        ) : user.role === 'student' ? (
          <>
            <Button onClick={enroll} loading={busy} className="flex-1">
              Начать курс
            </Button>
            <ButtonLink to={`/courses/${course.id}`} variant="secondary">
              Программа
            </ButtonLink>
          </>
        ) : (
          <ButtonLink to={`/courses/${course.id}`} variant="secondary" className="flex-1">
            Программа курса
          </ButtonLink>
        )
      }
    />
  )
}
