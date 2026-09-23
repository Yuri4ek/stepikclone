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

/** Тип шага на бэкенде. Визуальные типы (Scratch, Minecraft…) живут в content.type — см. steps/registry */
export type StepKind = 'theory' | 'quiz' | 'task' | 'code'

export type StepStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'submitted'
  | 'returned'
  | 'passed'
  | 'failed'

export type StepContent = Record<string, unknown>

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
  course: { id: string; title: string; slug: string; status: CourseStatus }
  modules: OutlineModule[]
}

export interface NextStep {
  course_id: string
  percent: number
  current_step: {
    id: string
    title: string
    kind: StepKind
    lesson_id: string
    module_id: string
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
  max_score: number
  content: StepContent
  progress: { status: StepStatus; score: number | null; feedback: string | null }
}

export interface CompleteResult {
  step_id: string
  status: StepStatus
  progress_percent: number
  rating: { score: number; breakdown_ref: string }
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
  progress_percent: number
}

export type SubmissionStatus = 'pending' | 'graded' | 'returned'

export interface Submission {
  id: string
  step_id: string
  check_type: 'auto' | 'manual'
  status: SubmissionStatus
  score: number | null
  feedback: string | null
  created_at: string
  reviewed_at: string | null
}

// ---------- Progress ----------

export interface BreakdownItem {
  step_id: string
  title: string
  kind: StepKind
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
    formula: string
    breakdown: BreakdownItem[]
  }
  updated_at: string
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
  student: StudentShort
  submitted_at: string
  preview: string
}

export interface ReviewSubmission {
  id: string
  status: SubmissionStatus
  payload: Answers
  step: { id: string; title: string; max_score: number; content: StepContent }
  student: StudentShort
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

export type LagLevel = 'warning' | 'critical'

export interface LagItem {
  enrollment_id: string
  course_id: string
  course_title: string
  student: StudentShort
  percent: number
  days_since_activity: number
  lag_level: LagLevel
  current_step_title: string | null
  last_seen_at: string | null
  reason: string
}

// ---------- Admin ----------

export interface CourseOut {
  id: string
  slug: string
  title: string
  description: string
  status: CourseStatus
}

export interface AdminStep {
  id: string
  title: string
  position: number
  kind: StepKind
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
