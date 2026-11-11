/**
 * Focused Supabase SQL Migration Script for School Results System
 * Streamlined to strictly necessary tables for students, exams, and results.
 * Includes UUIDs, constraints, indexes, and idempotent RLS policies.
 */

export const FULL_SUPABASE_MIGRATION_SQL = `-- ==============================================================================
-- DATABASE SCHEMA: مدرسة تي اتشرومبي للألحان (نظام نتائج وتقييم الطلاب)
-- كنيسة السيدة العذراء مريم والآباء الرسل ومارمرقس - سكينة
-- PostgreSQL / Supabase Migration
-- ==============================================================================

-- 1. تفعيل امتداد المعرفات الفريدة UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. جدول الأعوام الدراسية (ACADEMIC YEARS)
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. جدول المراحل التعليمية (EDUCATIONAL STAGES)
CREATE TABLE IF NOT EXISTS public.educational_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 1
);

-- 4. جدول الصفوف الدراسية (GRADES)
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_id UUID NOT NULL REFERENCES public.educational_stages(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    display_order INTEGER DEFAULT 1
);

-- 5. جدول الفصول الكنسية (CLASSES)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    term VARCHAR(50) DEFAULT 'term1', -- term1 / term2 / both
    category VARCHAR(50) DEFAULT 'grade_1_2' -- kg / grade_1_2 / grade_3_4 / grade_5_6 / prep_sec / general
);

-- 6. جدول الطلاب (STUDENTS) - كود الطالب يُسجل يدوياً وفريداً إلزامياً
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_code VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. جدول قيد الطلاب السنوي بالمراحل والصفوف (STUDENT ENROLLMENTS)
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
    stage_id UUID NOT NULL REFERENCES public.educational_stages(id) ON DELETE RESTRICT,
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    enrollment_status VARCHAR(50) DEFAULT 'enrolled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_student_year_enrollment UNIQUE (student_id, academic_year_id)
);

-- 8. جدول المواد الكنسية واللحنية (SUBJECTS)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT
);

-- 9. جدول دورات الامتحانات (EXAMS)
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
    stage_id UUID REFERENCES public.educational_stages(id) ON DELETE SET NULL,
    grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
    term VARCHAR(50) DEFAULT 'term1', -- term1 / term2 / both
    exam_type VARCHAR(50) NOT NULL DEFAULT 'final',
    exam_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. جدول مواد الامتحان والنهايات العظمى ودرجات النجاح (EXAM SUBJECTS)
CREATE TABLE IF NOT EXISTS public.exam_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    max_score NUMERIC(5, 2) NOT NULL CHECK (max_score > 0),
    pass_score NUMERIC(5, 2) CHECK (pass_score >= 0 AND pass_score <= max_score),
    display_order INTEGER DEFAULT 1,
    CONSTRAINT unique_exam_subject UNIQUE (exam_id, subject_id)
);

-- 11. جدول النتائج ورصد الدرجات (RESULTS)
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    exam_subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_student_exam_subject_result UNIQUE (student_id, exam_subject_id)
);

-- 12. جدول معايير التقديرات الديناميكية (GRADING RULES)
CREATE TABLE IF NOT EXISTS public.grading_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    minimum_percentage NUMERIC(5, 2) NOT NULL CHECK (minimum_percentage >= 0),
    maximum_percentage NUMERIC(5, 2) NOT NULL CHECK (maximum_percentage <= 100),
    evaluation_label VARCHAR(150) NOT NULL,
    grade_color VARCHAR(50),
    is_pass BOOLEAN DEFAULT true
);

-- 13. جدول حسابات مسؤولي الكنترول والإدارة (ADMIN PROFILES)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'results_manager', 'teacher')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. جدول سجلات عمليات الاستيراد من إكسل (IMPORT BATCHES)
CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    import_type VARCHAR(50) NOT NULL,
    total_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. جدول إعدادات الكنترول والشهادة الرسمية (SCHOOL SETTINGS)
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name VARCHAR(255) NOT NULL,
    church_name VARCHAR(255) NOT NULL,
    parish_name VARCHAR(255) NOT NULL,
    dean_name VARCHAR(255),
    spiritual_supervisor VARCHAR(255),
    phone_number VARCHAR(50),
    whatsapp_number VARCHAR(50),
    logo_url TEXT,
    results_disclaimer TEXT,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- الفهارس لتحقيق أعلى سرعة استعلام
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_students_student_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON public.student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_year ON public.student_enrollments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_subject ON public.results(exam_subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_published ON public.exams(is_published);

-- ==============================================================================
-- سياسات الأمان والحماية (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- سياسات عامة لقراءة إعدادات المدرسة والمراحل
DROP POLICY IF EXISTS "Public read for school settings" ON public.school_settings;
CREATE POLICY "Public read for school settings" ON public.school_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for active stages and grades" ON public.educational_stages;
CREATE POLICY "Public read for active stages and grades" ON public.educational_stages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for grades" ON public.grades;
CREATE POLICY "Public read for grades" ON public.grades FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for academic years" ON public.academic_years;
CREATE POLICY "Public read for academic years" ON public.academic_years FOR SELECT USING (true);

-- سياسات وصول مسؤولي الكنترول والدالة السحابية
DROP POLICY IF EXISTS "Admin full access to students" ON public.students;
CREATE POLICY "Admin full access to students" ON public.students FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to enrollments" ON public.student_enrollments;
CREATE POLICY "Admin full access to enrollments" ON public.student_enrollments FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to results" ON public.results;
CREATE POLICY "Admin full access to results" ON public.results FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to exams" ON public.exams;
CREATE POLICY "Admin full access to exams" ON public.exams FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to exam_subjects" ON public.exam_subjects;
CREATE POLICY "Admin full access to exam_subjects" ON public.exam_subjects FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to subjects" ON public.subjects;
CREATE POLICY "Admin full access to subjects" ON public.subjects FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to classes" ON public.classes;
CREATE POLICY "Admin full access to classes" ON public.classes FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to admin_profiles" ON public.admin_profiles;
CREATE POLICY "Admin full access to admin_profiles" ON public.admin_profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access to import_batches" ON public.import_batches;
CREATE POLICY "Admin full access to import_batches" ON public.import_batches FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin write to settings" ON public.school_settings;
CREATE POLICY "Admin write to settings" ON public.school_settings FOR ALL USING (true);
`;
