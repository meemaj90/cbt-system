export type Role = "ADMIN" | "TEACHER" | "STUDENT";
export type AssessmentType = "WRITTEN" | "PROJECT" | "ORAL";
export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ACTIVE" | "CLOSED";
export type QuestionType = "MCQ" | "SHORT_ANSWER" | "ESSAY" | "FILE_UPLOAD";
export type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string | null;
  classId?: string | null;
  className?: string | null;
}

export interface AssessmentListItem {
  id: string;
  title: string;
  description?: string | null;
  type: AssessmentType;
  status: AssessmentStatus;
  subject: { id: string; name: string; code: string };
  class?: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  startTime?: string | null;
  endTime?: string | null;
  duration?: number | null;
  totalMarks: number;
  passMark: number;
  createdAt: string;
  _count?: { questions: number; submissions: number };
}

export interface QuestionData {
  id?: string;
  order: number;
  type: QuestionType;
  text: string;
  marks: number;
  options?: string[] | null;
  correctAnswer?: string | null;
}

export interface CriteriaData {
  id?: string;
  name: string;
  description?: string;
  maxMarks: number;
}

export interface SubmissionResult {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber?: string | null;
  class?: string | null;
  subject: string;
  assessmentTitle: string;
  assessmentType: AssessmentType;
  totalMarks: number;
  scoreObtained: number | null;
  percentage: number | null;
  grade: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
}

export interface ResultExportRow {
  studentId: string;
  studentName: string;
  class: string;
  subject: string;
  assessmentTitle: string;
  assessmentType: string;
  totalMarks: number;
  scoreObtained: number | null;
  percentage: number | null;
  grade: string | null;
  status: string;
}
