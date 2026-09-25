// Типы строго по контракту API.md

export type Role = 'student' | 'curator' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  last_seen_at: string | null
}

export interface AuthResponse {
  access_token: string
  token_type: 'bearer'
  user: User
}

export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export type CourseStatus = 'draft' | 'published'

/**
 * Механизм проверки шага (реестр на бэкенде: app/steps/registry.py). Строка, а не закрытый список:
 * новый механизм добавляется на сервере без миграций. Как шаг выглядит у ученика — в `type` (content.type).
 */
export type StepKind = 'theory' | 'quiz' | 'task' | 'code' | (string & {})

export type StepStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'submitted'
  | 'returned'
  | 'passed'
  | 'failed'

export type StepContent = Record<string, unknown>

/** Паспорт курса из пакета содержания: классы, объём, инструмент, цель */
export interface CoursePassport {
  grades?: string
  volume?: string
  tool?: string
  goal?: string
}

// ---------- Catalog ----------

export interface EnrollmentShort {
  id: string
  status: string
  percent: number
  rating_score: number
}

export interface CatalogCourse {
  id: string
  slug: string
  title: string
  description: string
  cover_url: string | null
  passport: CoursePassport
  steps_total: number
  status: CourseStatus
  enrollment: EnrollmentShort | null
}

export interface Enrollment {
  id: string
  course_id: string
  status: string
  enrolled_at: string
}

export interface OutlineStep {
  id: string
  title: string
  position: number
  kind: StepKind
  /** Тип шага для ученика: theory, quiz, answer, scratch, scratch_answer, minecraft, project, algo… */
  type: string
  max_score: number
  is_required: boolean
  progress: { status: StepStatus; score: number | null; best_score: number | null }
}

export interface OutlineLesson {
  id: string
  title: string
  position: number
  steps: OutlineStep[]
}

export interface OutlineModule {
  id: string
  title: string
  position: number
  lessons: OutlineLesson[]
}

export interface Outline {
  course: { id: string; title: string; slug: string; status: CourseStatus; cover_url: string | null; description: string; passport: CoursePassport }
  modules: OutlineModule[]
}

export interface NextStep {
  course_id: string
  percent: number
  current_step: {
    id: string
    title: string
    kind: StepKind
    type: string
    lesson_id: string
    module_id: string
    module_title: string | null
    status: StepStatus
    action_hint: string
  } | null
  message: string
}

// ---------- Learning ----------

export interface LearningStep {
  id: string
  title: string
  kind: StepKind
  type: string
  max_score: number
  content: StepContent
  progress: {
    status: StepStatus
    score: number | null
    best_score?: number | null
    attempts?: number
    feedback: string | null
    last_submission?: (Submission & { payload?: Answers }) | null
  }
}

export interface CompleteResult {
  step_id: string
  status: StepStatus
  progress_percent: number
  rating: { score: number; breakdown_ref: string }
  next_step_id: string | null
}

export type Answers = Record<string, unknown>

export interface SubmitResult {
  submission_id: string
  check_type: 'auto' | 'manual'
  status: SubmissionStatus
  step_status: StepStatus
  score: number | null
  max_score: number
  feedback: string | null
  result: CheckResult | null
  progress_percent: number
  /** Следующий шаг, если он уже открыт */
  next_step_id: string | null
}

export type Verdict = 'OK' | 'WA' | 'TLE' | 'RE' | 'ML'

/** Результат прогона по тестам. Ввод и ответ приходят только для примеров из условия */
export interface CheckResult {
  passed: number
  total: number
  tests: {
    n: number
    verdict: Verdict
    time_ms: number
    sample: boolean
    input?: string
    expected?: string
    actual?: string
    error?: string
  }[]
}

export type SubmissionStatus = 'pending' | 'graded' | 'returned'

export interface Submission {
  id: string
  step_id: string
  check_type: 'auto' | 'manual'
  status: SubmissionStatus
  score: number | null
  feedback: string | null
  result?: CheckResult | null
  created_at: string
  reviewed_at: string | null
}

export interface SubmissionListItem extends Submission {
  step_title: string
  step_type: string
  max_score: number
  course_id: string
  course_title: string
  payload: Answers
}

// ---------- Progress ----------

export interface BreakdownItem {
  step_id: string
  title: string
  kind: StepKind
  type: string
  score: number
  max_score: number
  source: 'auto' | 'manual' | 'theory'
}

export interface CourseProgress {
  course_id: string
  enrollment_id: string
  percent: number
  completed_required_steps: number
  total_required_steps: number
  current_step_id: string | null
  rating: {
    score: number
    total_score: number
    total_max: number
    /** Баллы за работы, которые сейчас у куратора */
    pending_max: number
    formula: string
    breakdown: BreakdownItem[]
    /** Место в группе курса (по рейтингу) */
    place: number | null
    group_size: number
  }
  /** Сколько дней подряд ученик что-то сдаёт или проходит (по всем курсам) */
  streak_days: number
  updated_at: string
}

export interface Leaderboard {
  course_id: string
  place: number | null
  group_size: number
  items: { place: number; name: string; rating: number; percent: number; me: boolean }[]
}

// ---------- Reviews ----------

export interface StudentShort {
  id: string
  full_name: string
  email?: string
}

export interface QueueItem {
  submission_id: string
  course_id: string
  course_title: string
  step_id: string
  step_title: string
  step_type: string
  has_screenshot: boolean
  student: StudentShort
  submitted_at: string
  preview: string
}

export interface ReviewSubmission {
  id: string
  status: SubmissionStatus
  payload: Answers
  step: { id: string; title: string; kind: StepKind; type: string; max_score: number; content: StepContent }
  student: StudentShort | null
  course_id: string
  /** Какая по счёту это попытка ученика на шаге */
  attempt: number
  created_at: string
}

export interface ReviewResult {
  submission_id: string
  status: SubmissionStatus
  step_status: StepStatus
  score: number | null
  feedback: string
}

// ---------- Lag ----------

export type LagLevel = 'ok' | 'warning' | 'critical'

export interface LagSignal {
  code: 'inactive' | 'stalled' | 'stuck' | 'returned_idle' | 'behind' | (string & {})
  level: LagLevel
  text: string
}

export interface LagItem {
  enrollment_id: string
  course_id: string
  course_title: string
  student: StudentShort
  percent: number
  rating: number
  days_since_activity: number
  days_since_progress: number
  lag_level: LagLevel
  current_step_title: string | null
  last_seen_at: string | null
  last_progress_at: string | null
  /** Почему ученик в группе риска — ранние сигналы, а не только «давно не заходил» */
  signals: LagSignal[]
  reason: string
}

// ---------- Questions ----------

export interface Question {
  id: string
  step_id: string
  step_title: string
  course_id: string
  course_title: string
  student: StudentShort
  text: string
  status: 'open' | 'answered'
  answer: string | null
  answered_by: StudentShort | null
  created_at: string
  answered_at: string | null
}

export interface QuestionList {
  items: Question[]
  total: number
  open: number
}

// ---------- Admin ----------

export interface CourseOut {
  id: string
  slug: string
  title: string
  description: string
  cover_url: string | null
  passport: CoursePassport
  status: CourseStatus
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: Role
  last_seen_at?: string | null
  /** Кураторам — курсы, на которые назначены; ученикам — курсы, на которые записаны */
  courses: { id: string; title: string }[]
}

export interface CoursePeople {
  curators: StudentShort[]
  students: (StudentShort & { enrolled_at: string | null; percent: number })[]
}

export interface AdminStep {
  id: string
  title: string
  position: number
  kind: StepKind
  type: string
  max_score: number
  is_required: boolean
  content: StepContent
}

export interface AdminLesson {
  id: string
  title: string
  position: number
  steps: AdminStep[]
}

export interface AdminModule {
  id: string
  title: string
  position: number
  lessons: AdminLesson[]
}

export interface AdminCourseTree extends CourseOut {
  modules: AdminModule[]
}

export interface StepInput {
  title: string
  position: number
  kind: StepKind
  max_score: number
  is_required: boolean
  content: StepContent
}
