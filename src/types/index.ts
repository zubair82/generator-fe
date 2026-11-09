export type ViewType = 'dashboard' | 'papers' | 'students' | 'upload_pdf' | 'manual_entry' | 'variant_gen' | 'variant_pdf' | 'verification' | 'add-resource' | 'review' | 'registration' | 'application';
export type DashboardMode = 'system' | 'teacher';
export type DocumentStatus = 'AI-PROCESSED' | 'MANUALLY-VERIFIED' | 'PENDING';

export interface TeacherPerformance {
  id: string;
  name: string;
  subject: string;
  papers: number;
  verified: number;
  status: 'ACTIVE' | 'PENDING' | 'REVIEWING';
  avatar: string;
}

export interface QuestionPaper {
  id: string;
  name: string;
  courseCode: string;
  instructor: string;
  uploadedAt: string;
  status: DocumentStatus;
  subject: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'purple';
}

export interface User {
  id?: string;
  teacher_id?: string;
  name: string;
  display_name?: string;
  role: string;
  email: string;
  bio?: string;
  upi_id?: string;
  phone?: string;
  phone_number?: string;
  banner_path?: string;
}

export interface Toast {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
