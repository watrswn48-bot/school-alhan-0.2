/**
 * Database schema and application interfaces
 * Matches the Supabase PostgreSQL schema specifications
 */

export type UserRole = 'super_admin' | 'admin' | 'results_manager' | 'content_manager' | 'teacher';

export interface AdminProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  admin_permissions?: AdminPermission[];
}

export interface AdminPermission {
  id: string;
  admin_profile_id: string;
  permission_key: 'read_academics' | 'manage_academics' | 'manage_students' | 'manage_results' | 'manage_content' | 'publish_results';
  academic_year_id?: string | null;
  stage_id?: string | null;
  grade_id?: string | null;
  class_id?: string | null;
  term_id?: string | null;
  subject_id?: string | null;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2025 - 2026"
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EducationalStage {
  id: string;
  name: string; // e.g., "مرحلة الحضانة", "مرحلة الابتدائي", "مرحلة الإعدادي", "مرحلة الثانوي", "مرحلة الشمامسة والخريجين"
  description: string;
  display_order: number;
}

export interface Grade {
  id: string;
  stage_id: string;
  name: string; // e.g., "الصف الأول الابتدائي", "المستوى الأول شمامسة"
  display_order: number;
}

export type SemesterTerm = 'term1' | 'term2' | 'both';
export type ClassCategory = 
  | 'kg'          // كيجي
  | 'grade_1_2'   // اولي و تانية
  | 'grade_3_4'   // تالتة ورابعة
  | 'grade_5_6'   // خامسة و ستة
  | 'prep_sec'    // اعدادي و ثانوي
  | 'primary'     // ابتدائي عام
  | 'prep'        // إعدادي
  | 'secondary'   // ثانوي
  | 'graduates'   // خريجين وشمامسة
  | 'general';    // عام

export interface ClassItem {
  id: string;
  grade_id: string;
  academic_year_id: string;
  name: string; // e.g., "فصل القديس أثناسيوس الرسولي"
  term?: SemesterTerm; // الترم الأول / الترم الثاني / طوال العام
  category?: ClassCategory; // فئة المرحلة: كيجي، ابتدائي، إعدادي، ثانوي، شمامسة، عام
  term_id?: string;
}

export interface Student {
  id: string;
  student_code: string; // MANUALLY ASSIGNED by administrator, unique
  full_name: string;
  phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  notes?: string;
  created_at: string;
  is_active: boolean;
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  academic_year_id: string;
  stage_id: string;
  grade_id: string;
  class_id: string;
  enrollment_status: 'enrolled' | 'graduated' | 'transferred' | 'suspended';
  created_at: string;
}

export type ExamType = 'monthly' | 'midterm' | 'final' | 'practical' | 'custom';

export interface Exam {
  id: string;
  name: string; // e.g., "امتحان الفصل الدراسي الأول - ألحان وطقس"
  academic_year_id: string;
  stage_id?: string;
  grade_id?: string;
  term?: SemesterTerm; // الترم الأول أو الثاني
  term_id?: string;
  class_id?: string;
  exam_type: ExamType;
  exam_date: string;
  is_published: boolean;
  notes?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string; // e.g., "الألحان الكنسية", "الطقس الكنسي", "اللغة القبطية", "العقيدة الأرثوذكسية", "التاريخ الكنسي"
  description: string;
}

export interface ExamSubject {
  id: string;
  exam_id: string;
  subject_id: string;
  max_score: number; // e.g., 50 or 100
  pass_score?: number; // e.g., 25 or 50
  display_order: number;
  class_id?: string;
}

export interface Result {
  id: string;
  student_id: string;
  exam_subject_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface GradingRule {
  id: string;
  academic_year_id: string;
  minimum_percentage: number;
  maximum_percentage: number;
  evaluation_label: string; // e.g., "ممتاز مرتفع", "ممتاز", "جيد جداً", "جيد", "مقبول", "يحتاج لمتابعة"
  grade_color?: string;
  is_pass: boolean;
}

export interface ImportBatch {
  id: string;
  uploaded_by: string;
  file_name: string;
  import_type: 'students' | 'results' | 'subjects';
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  error_details?: string;
  created_at: string;
}

export interface SchoolSettings {
  id: string;
  school_name: string;
  church_name: string;
  parish_name: string;
  dean_name: string;
  spiritual_supervisor: string;
  phone_number: string;
  whatsapp_number: string;
  email: string;
  address: string;
  logo_url?: string; // Custom uploaded base64 data URL or external image link
  facebook_url?: string;
  youtube_url?: string;
  announcement_banner?: string;
  show_banner: boolean;
  results_disclaimer: string;
  academic_year_id: string;
  about_text?: string;
  updated_at: string;
}

export interface StudentFullResultLookup {
  student: Student;
  enrollment: StudentEnrollment & {
    academic_year: AcademicYear;
    stage: EducationalStage;
    grade: Grade;
    class_item: ClassItem;
  };
  exam: Exam;
  subjects_results: Array<{
    subject_id: string;
    subject_name: string;
    max_score: number;
    score: number;
    pass_score?: number;
  }>;
  total_score: number;
  total_max_score: number;
  percentage: number;
  evaluation: string;
  is_pass: boolean;
}
