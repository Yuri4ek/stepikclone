import { useState } from 'react'
import { Link } from 'react-router-dom'
import { questionApi, QuestionThread } from '@/entities/question'
import { useUser } from '@/entities/session'
import { Avatar } from '@/entities/user'
import { AnswerQuestionForm } from '@/features/answer-question'
import { CourseFilter } from '@/features/filter-by-course'
import { useAsync, waitLabel } from '@/shared/lib'
import { Card, EmptyState, ErrorBox, Loader, PageHeader, Segmented } from '@/shared/ui'

type Filter = 'open' | 'answered'

/** Вопросы учеников по конкретным шагам курса — обязательная часть контура куратора */
export function QuestionsPage() {
  const user = useUser()
  const [status, setStatus] = useState<Filter>('open')
  const [courseId, setCourseId] = useState('')
  const { data, error, loading, reload } = useAsync(() => questionApi.inbox({ status, course_id: courseId || undefined }), [status, courseId])

  return (
    <>
      <PageHeader title="Вопросы учеников" subtitle="Каждый вопрос привязан к шагу курса — ответ ученик увидит прямо на этом шаге" actions={<CourseFilter role={user.role} value={courseId} onChange={setCourseId} />} />
      <Segmented<Filter>
        className="mb-4"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'open', label: 'Ждут ответа' },
          { value: 'answered', label: 'С ответом' },
        ]}
      />
      {error && <ErrorBox error={error} onRetry={reload} />}
      {loading && !data && <Loader />}
      {data &&
        (data.items.length === 0 ? (
          <EmptyState icon="message" title={status === 'open' ? 'Новых вопросов нет' : 'Отвеченных вопросов пока нет'} />
        ) : (
          <div className="space-y-4">
            {data.items.map((q) => (
              <Card key={q.id} className="p-5">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <Avatar name={q.student.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{q.student.full_name}</div>
                    <div className="text-sm text-brand-ink-3">
                      {q.course_title} · шаг{' '}
                      <Link to={`/courses/${q.course_id}`} className="font-semibold text-brand-blue hover:underline">
                        «{q.step_title}»
                      </Link>
                    </div>
                  </div>
                  {q.status === 'open' && <span className="num font-mono text-sm text-brand-ink-2">ждёт {waitLabel(q.created_at)}</span>}
                </div>
                <QuestionThread q={q}>{q.status === 'open' && <AnswerQuestionForm questionId={q.id} onAnswered={() => void reload()} />}</QuestionThread>
              </Card>
            ))}
          </div>
        ))}
    </>
  )
}
