import { getSupabaseClient } from './supabase';
import {
  AcademicYear,
  EducationalStage,
  Grade,
  ClassItem,
  Student,
  StudentEnrollment,
  Exam,
  Subject,
  ExamSubject,
  Result,
  GradingRule,
  ImportBatch,
  SchoolSettings,
  StudentFullResultLookup,
  AdminProfile
} from '../types/database';

const STORAGE_KEYS = {
  SETTINGS: 'etchrompi_settings',
  YEARS: 'etchrompi_academic_years',
  STAGES: 'etchrompi_stages',
  GRADES: 'etchrompi_grades',
  CLASSES: 'etchrompi_classes',
  STUDENTS: 'etchrompi_students',
  ENROLLMENTS: 'etchrompi_enrollments',
  EXAMS: 'etchrompi_exams',
  SUBJECTS: 'etchrompi_subjects',
  EXAM_SUBJECTS: 'etchrompi_exam_subjects',
  RESULTS: 'etchrompi_results',
  GRADING_RULES: 'etchrompi_grading_rules',
  BATCHES: 'etchrompi_import_batches',
  ADMINS: 'etchrompi_admin_profiles',
  ACTIVE_ADMIN: 'etchrompi_active_admin',
};

// Database-backed defaults. No demo students, grades, exams, results, or admin passwords.
export const INITIAL_SETTINGS: SchoolSettings = {
  id: '',
  school_name: 'مدرسة تي اتشرومبي للألحان',
  church_name: '',
  parish_name: '',
  dean_name: '',
  spiritual_supervisor: '',
  phone_number: '',
  whatsapp_number: '',
  email: '',
  address: '',
  logo_url: '',
  facebook_url: '',
  youtube_url: '',
  announcement_banner: '',
  show_banner: false,
  results_disclaimer: 'النتائج المعروضة هي النتائج التي اعتمدتها إدارة المدرسة ونشرتها.',
  academic_year_id: '',
  about_text: '',
  primary_color: '#0c1a30',
  accent_color: '#c5a059',
  updated_at: new Date().toISOString(),
};

export const INITIAL_YEARS: AcademicYear[] = [];
export const INITIAL_STAGES: EducationalStage[] = [];
export const INITIAL_GRADES: Grade[] = [];
export const INITIAL_CLASSES: ClassItem[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_ENROLLMENTS: StudentEnrollment[] = [];
export const INITIAL_EXAMS: Exam[] = [];
export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_EXAM_SUBJECTS: ExamSubject[] = [];
export const INITIAL_RESULTS: Result[] = [];
export const INITIAL_GRADING_RULES: GradingRule[] = [];
export const INITIAL_ADMINS: AdminProfile[] = [];

class DataService {
  private cache = new Map<string, unknown>();
  private idMap = new Map<string, string>();
  private termMap = new Map<string, string>();
  private initialized = false;
  private initializing: Promise<void> | null = null;

  private get<T>(key: string, defaultVal: T): T {
    return (this.cache.has(key) ? this.cache.get(key) : defaultVal) as T;
  }

  private uuid(value?: string): string {
    if (!value) return crypto.randomUUID();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return value;
    const existing = this.idMap.get(value);
    if (existing) return existing;
    const created = crypto.randomUUID();
    this.idMap.set(value, created);
    return created;
  }

  private termId(yearId: string, gradeId: string, term?: string): string | null {
    if (!term || term === 'both') return null;
    const termNumber = term === 'term2' ? 2 : 1;
    const terms = (this.cache.get('academic_terms') as any[] | undefined) ?? [];
    return terms.find(t => t.academic_year_id === yearId && t.grade_id === gradeId && Number(t.term_number) === termNumber)?.id ?? null;
  }

  private toDatabaseRow(key: string, input: any): any {
    if (!input || typeof input !== 'object') return input;
    const row: any = { ...input };
    row.id = this.uuid(row.id);
    const foreignKeys = ['academic_year_id','stage_id','grade_id','class_id','student_id','exam_id','subject_id','exam_subject_id','term_id','admin_profile_id'];
    for (const field of foreignKeys) {
      if (row[field]) row[field] = this.uuid(row[field]);
    }
    if (key === STORAGE_KEYS.CLASSES) {
      row.term_id = row.term_id || this.termId(row.academic_year_id, row.grade_id, row.term);
      delete row.term;
    }
    if (key === STORAGE_KEYS.EXAMS) {
      row.term_id = row.term_id || this.termId(row.academic_year_id, row.grade_id, row.term);
      delete row.term;
    }
    delete row.password;
    return row;
  }

  private fromDatabaseRows(key: string, rows: any[]): any[] {
    return (rows ?? []).map(input => {
      const row = { ...input };
      if (key === STORAGE_KEYS.CLASSES || key === STORAGE_KEYS.EXAMS) {
        const term = row.term_id ? this.termMap.get(row.term_id) : undefined;
        row.term = term || (key === STORAGE_KEYS.EXAMS ? 'both' : 'term1');
      }
      return row;
    });
  }

  private tableForKey(key: string): string | null {
    const map: Record<string, string> = {
      [STORAGE_KEYS.YEARS]: 'academic_years',
      [STORAGE_KEYS.STAGES]: 'educational_stages',
      [STORAGE_KEYS.GRADES]: 'grades',
      [STORAGE_KEYS.CLASSES]: 'classes',
      [STORAGE_KEYS.STUDENTS]: 'students',
      [STORAGE_KEYS.ENROLLMENTS]: 'student_enrollments',
      [STORAGE_KEYS.EXAMS]: 'exams',
      [STORAGE_KEYS.SUBJECTS]: 'subjects',
      [STORAGE_KEYS.EXAM_SUBJECTS]: 'exam_subjects',
      [STORAGE_KEYS.RESULTS]: 'results',
      [STORAGE_KEYS.GRADING_RULES]: 'grading_rules',
      [STORAGE_KEYS.BATCHES]: 'import_batches',
    };
    return map[key] ?? null;
  }

  private persist(key: string, value: any, previous: any): void {
    const client = getSupabaseClient();
    if (!client || key === STORAGE_KEYS.ACTIVE_ADMIN || key === STORAGE_KEYS.ADMINS) return;
    const table = this.tableForKey(key);
    if (key === STORAGE_KEYS.SETTINGS) {
      const row = this.toDatabaseRow(key, value);
      void client.from('school_settings').upsert(row).then(({ error }) => {
        if (error) console.error('Supabase settings write failed:', error.message);
      });
      return;
    }
    if (!table || !Array.isArray(value)) return;
    const rows = value.map(item => this.toDatabaseRow(key, item));
    if (rows.length) {
      void client.from(table).upsert(rows).then(({ error }) => {
        if (error) console.error(`Supabase ${table} write failed:`, error.message);
      });
    }
    const currentIds = new Set(rows.map(row => row.id));
    const removed = (Array.isArray(previous) ? previous : []).filter((row: any) => row?.id && !currentIds.has(this.uuid(row.id)));
    for (const row of removed) {
      void client.from(table).delete().eq('id', this.uuid(row.id)).then(({ error }) => {
        if (error) console.error(`Supabase ${table} delete failed:`, error.message);
      });
    }
  }

  private set<T>(key: string, value: T): void {
    const previous = this.cache.get(key);
    const normalize = (item: any) => {
      const row: any = { ...item };
      row.id = this.uuid(row.id);
      for (const field of ['academic_year_id','stage_id','grade_id','class_id','student_id','exam_id','subject_id','exam_subject_id','term_id','admin_profile_id']) {
        if (row[field]) row[field] = this.uuid(row[field]);
      }
      if ((key === STORAGE_KEYS.CLASSES || key === STORAGE_KEYS.EXAMS) && !row.term_id) {
        row.term_id = this.termId(row.academic_year_id, row.grade_id, row.term);
      }
      return row;
    };
    const normalized: any = Array.isArray(value) ? value.map(normalize) : (value && typeof value === 'object' ? normalize(value) : value);
    this.cache.set(key, normalized);
    this.persist(key, normalized, previous);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;
    const client = getSupabaseClient();
    if (!client) return;
    this.initializing = (async () => {
      const [settings, years, stages, grades, classes, students, enrollments, exams, subjects, examSubjects, results, gradingRules, batches, terms] = await Promise.all([
        client.from('school_settings').select('*').limit(1).maybeSingle(),
        client.from('academic_years').select('*').order('name'),
        client.from('educational_stages').select('*').order('display_order'),
        client.from('grades').select('*').order('display_order'),
        client.from('classes').select('*').order('name'),
        client.from('students').select('*').order('full_name'),
        client.from('student_enrollments').select('*'),
        client.from('exams').select('*').order('exam_date'),
        client.from('subjects').select('*').order('name'),
        client.from('exam_subjects').select('*').order('display_order'),
        client.from('results').select('*'),
        client.from('grading_rules').select('*').order('minimum_percentage', { ascending: false }),
        client.from('import_batches').select('*').order('created_at', { ascending: false }),
        client.from('academic_terms').select('*').order('term_number'),
      ]);
      const termRows = terms.data ?? [];
      this.cache.set('academic_terms', termRows);
      this.termMap = new Map(termRows.map((term: any) => [term.id, Number(term.term_number) === 2 ? 'term2' : 'term1']));
      const values: Array<[string, any]> = [
        [STORAGE_KEYS.SETTINGS, settings.data ?? INITIAL_SETTINGS],
        [STORAGE_KEYS.YEARS, years.data ?? []],
        [STORAGE_KEYS.STAGES, stages.data ?? []],
        [STORAGE_KEYS.GRADES, grades.data ?? []],
        [STORAGE_KEYS.CLASSES, this.fromDatabaseRows(STORAGE_KEYS.CLASSES, classes.data ?? [])],
        [STORAGE_KEYS.STUDENTS, students.data ?? []],
        [STORAGE_KEYS.ENROLLMENTS, enrollments.data ?? []],
        [STORAGE_KEYS.EXAMS, this.fromDatabaseRows(STORAGE_KEYS.EXAMS, exams.data ?? [])],
        [STORAGE_KEYS.SUBJECTS, subjects.data ?? []],
        [STORAGE_KEYS.EXAM_SUBJECTS, examSubjects.data ?? []],
        [STORAGE_KEYS.RESULTS, results.data ?? []],
        [STORAGE_KEYS.GRADING_RULES, gradingRules.data ?? []],
        [STORAGE_KEYS.BATCHES, batches.data ?? []],
        [STORAGE_KEYS.ADMINS, []],
      ];
      for (const [key, value] of values) this.cache.set(key, value);
      this.initialized = true;
    })().finally(() => { this.initializing = null; });
    return this.initializing!;
  }

  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }

  clearSession(): void {
    this.cache.clear();
    this.idMap.clear();
    this.termMap.clear();
    this.initialized = false;
  }

  // --- Settings ---
  getSettings(): SchoolSettings {
    return this.get<SchoolSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  updateSettings(settings: Partial<SchoolSettings>): SchoolSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- Academic Years ---
  getAcademicYears(): AcademicYear[] {
    return this.get<AcademicYear[]>(STORAGE_KEYS.YEARS, INITIAL_YEARS);
  }

  async saveAcademicYear(year: AcademicYear): Promise<void> {
    const list = this.getAcademicYears();
    const idx = list.findIndex(y => y.id === year.id);
    const normalizedYear = { ...year, id: this.uuid(year.id) };
    if (idx >= 0) list[idx] = normalizedYear;
    else list.push(normalizedYear);
    this.set(STORAGE_KEYS.YEARS, list);

    const client = getSupabaseClient();
    if (!client) return;
    const { error: yearError } = await client.from('academic_years').upsert(this.toDatabaseRow(STORAGE_KEYS.YEARS, normalizedYear));
    if (yearError) throw yearError;

    // Every year gets two terms for each of the eight grades.
    const { data: grades, error: gradesError } = await client.from('grades').select('id');
    if (gradesError) throw gradesError;
    const termRows = (grades ?? []).flatMap((grade: any) => [
      { academic_year_id: normalizedYear.id, grade_id: grade.id, term_number: 1, name: 'الترم الأول' },
      { academic_year_id: normalizedYear.id, grade_id: grade.id, term_number: 2, name: 'الترم الثاني' },
    ]);
    if (termRows.length) {
      const { error: termsError } = await client.from('academic_terms').upsert(termRows, {
        onConflict: 'academic_year_id,grade_id,term_number',
      });
      if (termsError) throw termsError;
    }
    await this.refresh();
  }

  setActiveAcademicYear(yearId: string): void {
    const list = this.getAcademicYears().map(y => ({
      ...y,
      is_active: y.id === yearId
    }));
    this.set(STORAGE_KEYS.YEARS, list);
    this.updateSettings({ academic_year_id: yearId });
  }

  deleteAcademicYear(yearId: string): boolean {
    const list = this.getAcademicYears().filter(y => y.id !== yearId);
    this.set(STORAGE_KEYS.YEARS, list);
    return true;
  }

  // --- Stages, Grades, Classes ---
  getStages(): EducationalStage[] {
    return this.get<EducationalStage[]>(STORAGE_KEYS.STAGES, []);
  }

  applyTwoLevelsFourYearsStructure(): void {
    // The two-level/four-year scaffold is seeded in Supabase migrations.
    void this.initialize();
  }

  saveStage(stage: EducationalStage): void {
    const list = this.getStages();
    const idx = list.findIndex(s => s.id === stage.id);
    if (idx >= 0) list[idx] = stage;
    else list.push(stage);
    this.set(STORAGE_KEYS.STAGES, list);
  }

  deleteStage(stageId: string): boolean {
    const list = this.getStages().filter(s => s.id !== stageId);
    this.set(STORAGE_KEYS.STAGES, list);
    return true;
  }

  getGrades(): Grade[] {
    return this.get<Grade[]>(STORAGE_KEYS.GRADES, INITIAL_GRADES);
  }

  saveGrade(grade: Grade): void {
    const list = this.getGrades();
    const idx = list.findIndex(g => g.id === grade.id);
    if (idx >= 0) list[idx] = grade;
    else list.push(grade);
    this.set(STORAGE_KEYS.GRADES, list);
  }

  deleteGrade(gradeId: string): boolean {
    const list = this.getGrades().filter(g => g.id !== gradeId);
    this.set(STORAGE_KEYS.GRADES, list);
    return true;
  }

  getClasses(): ClassItem[] {
    return this.get<ClassItem[]>(STORAGE_KEYS.CLASSES, []);
  }

  saveClass(cls: ClassItem): void {
    const list = this.getClasses();
    const idx = list.findIndex(c => c.id === cls.id);
    if (idx >= 0) list[idx] = cls;
    else list.push(cls);
    this.set(STORAGE_KEYS.CLASSES, list);
  }

  deleteClass(classId: string): boolean {
    const list = this.getClasses().filter(c => c.id !== classId);
    this.set(STORAGE_KEYS.CLASSES, list);
    return true;
  }

  // --- Subjects ---
  getSubjects(): Subject[] {
    return this.get<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  }

  saveSubject(subj: Subject): void {
    const list = this.getSubjects();
    const idx = list.findIndex(s => s.id === subj.id);
    if (idx >= 0) list[idx] = subj;
    else list.push(subj);
    this.set(STORAGE_KEYS.SUBJECTS, list);
  }

  deleteSubject(subjectId: string): boolean {
    const list = this.getSubjects().filter(s => s.id !== subjectId);
    this.set(STORAGE_KEYS.SUBJECTS, list);
    return true;
  }

  // --- Students (STRICT REQUIREMENT: Manual Student Codes, No Auto-Generation, Unique Codes) ---
  getStudents(): Student[] {
    return this.get<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  findStudentByCode(code: string): Student | undefined {
    const clean = code.trim().toLowerCase();
    return this.getStudents().find(s => s.student_code.trim().toLowerCase() === clean);
  }

  saveStudent(student: Student): { success: boolean; error?: string } {
    if (!student.student_code || !student.student_code.trim()) {
      return { success: false, error: 'كود الطالب إلزامي، ويجب إدخاله يدوياً بواسطة مسؤول المدرسة.' };
    }

    if (!student.full_name || !student.full_name.trim()) {
      return { success: false, error: 'اسم الطالب بالكامل إلزامي.' };
    }

    const list = this.getStudents();
    const normalizedCode = student.student_code.trim();

    // Check code uniqueness: cannot match any other student's code
    const existing = list.find(s => s.student_code.toLowerCase() === normalizedCode.toLowerCase() && s.id !== student.id);
    if (existing) {
      return {
        success: false,
        error: `كود الطالب (${normalizedCode}) مسجل مسبقاً للطالب "${existing.full_name}". الأكواد يجب أن تكون فريدة ومحددة يدوياً.`
      };
    }

    const idx = list.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      list[idx] = { ...student, student_code: normalizedCode };
    } else {
      list.push({ ...student, student_code: normalizedCode, created_at: student.created_at || new Date().toISOString() });
    }

    this.set(STORAGE_KEYS.STUDENTS, list);
    return { success: true };
  }

  deleteStudent(id: string): void {
    const list = this.getStudents().filter(s => s.id !== id);
    this.set(STORAGE_KEYS.STUDENTS, list);
    // Also remove enrollment
    const enrollments = this.getEnrollments().filter(e => e.student_id !== id);
    this.set(STORAGE_KEYS.ENROLLMENTS, enrollments);
  }

  // --- Enrollments ---
  getEnrollments(): StudentEnrollment[] {
    return this.get<StudentEnrollment[]>(STORAGE_KEYS.ENROLLMENTS, []);
  }

  saveEnrollment(enrollment: StudentEnrollment): void {
    const list = this.getEnrollments();
    const idx = list.findIndex(e => e.student_id === enrollment.student_id && e.academic_year_id === enrollment.academic_year_id);
    if (idx >= 0) list[idx] = enrollment;
    else list.push(enrollment);
    this.set(STORAGE_KEYS.ENROLLMENTS, list);
  }

  // --- Exams & Exam Subjects ---
  getExams(): Exam[] {
    return this.get<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
  }

  saveExam(exam: Exam): void {
    const list = this.getExams();
    const idx = list.findIndex(e => e.id === exam.id);
    if (idx >= 0) list[idx] = exam;
    else list.push(exam);
    this.set(STORAGE_KEYS.EXAMS, list);
  }

  deleteExam(examId: string): void {
    const list = this.getExams().filter(e => e.id !== examId);
    this.set(STORAGE_KEYS.EXAMS, list);
  }

  getExamSubjects(examId?: string): ExamSubject[] {
    const all = this.get<ExamSubject[]>(STORAGE_KEYS.EXAM_SUBJECTS, INITIAL_EXAM_SUBJECTS);
    if (examId) return all.filter(es => es.exam_id === examId);
    return all;
  }

  saveExamSubject(es: ExamSubject): void {
    const list = this.getExamSubjects();
    const idx = list.findIndex(item => item.id === es.id);
    if (idx >= 0) list[idx] = es;
    else list.push(es);
    this.set(STORAGE_KEYS.EXAM_SUBJECTS, list);
  }

  deleteExamSubject(id: string): void {
    const list = this.getExamSubjects().filter(item => item.id !== id);
    this.set(STORAGE_KEYS.EXAM_SUBJECTS, list);
  }

  // --- Results & Grading Rules ---
  getResults(): Result[] {
    return this.get<Result[]>(STORAGE_KEYS.RESULTS, INITIAL_RESULTS);
  }

  saveResult(result: Result): { success: boolean; error?: string } {
    // Validate score is not negative and does not exceed max_score
    const examSubjects = this.getExamSubjects();
    const examSubject = examSubjects.find(es => es.id === result.exam_subject_id);

    if (result.score < 0) {
      return { success: false, error: 'الدرجة لا يمكن أن تكون أقل من صفر.' };
    }

    if (examSubject && result.score > examSubject.max_score) {
      return { success: false, error: `الدرجة (${result.score}) تتجاوز النهاية العظمى للمادة (${examSubject.max_score}).` };
    }

    const list = this.getResults();
    const idx = list.findIndex(r => r.student_id === result.student_id && r.exam_subject_id === result.exam_subject_id);
    const updatedRecord = {
      ...result,
      updated_at: new Date().toISOString(),
      created_at: result.created_at || new Date().toISOString()
    };

    if (idx >= 0) list[idx] = updatedRecord;
    else list.push(updatedRecord);

    this.set(STORAGE_KEYS.RESULTS, list);
    return { success: true };
  }

  getGradingRules(): GradingRule[] {
    return this.get<GradingRule[]>(STORAGE_KEYS.GRADING_RULES, INITIAL_GRADING_RULES);
  }

  saveGradingRule(rule: GradingRule): void {
    const list = this.getGradingRules();
    const idx = list.findIndex(r => r.id === rule.id);
    if (idx >= 0) list[idx] = rule;
    else list.push(rule);
    this.set(STORAGE_KEYS.GRADING_RULES, list);
  }

  calculateEvaluation(percentage: number): { label: string; isPass: boolean; color: string } {
    const rules = this.getGradingRules().sort((a, b) => b.minimum_percentage - a.minimum_percentage);
    for (const rule of rules) {
      if (percentage >= rule.minimum_percentage && percentage <= rule.maximum_percentage) {
        return {
          label: rule.evaluation_label,
          isPass: rule.is_pass,
          color: rule.grade_color || '#1e3a8a'
        };
      }
    }

    return {
      label: percentage >= 50 ? 'ناجح' : 'دون المستوى / دور ثانٍ',
      isPass: percentage >= 50,
      color: percentage >= 50 ? '#15803d' : '#dc2626'
    };
  }

  // --- Student Results Query Portal (Edge Function / Secure Lookup) ---
  lookupStudentResults(studentCode: string): {
    success: boolean;
    data?: StudentFullResultLookup[];
    error?: string;
  } {
    if (!studentCode || !studentCode.trim()) {
      return { success: false, error: 'يرجى إدخال كود الطالب الخاص بك للاستعلام عن النتيجة.' };
    }

    const student = this.findStudentByCode(studentCode);
    if (!student) {
      return {
        success: false,
        error: 'كود الطالب غير صحيح أو غير مسجل في قاعدة بيانات المدرسة. يرجى التأكد من كتابة الكود بدقة كما هو مدون في استمارة القيد، أو مراجعة إدارة الكنترول.'
      };
    }

    // Find active enrollment
    const enrollments = this.getEnrollments().filter(e => e.student_id === student.id);
    if (enrollments.length === 0) {
      return { success: false, error: 'لا يوجد قيد دراسي مسجل لهذا الطالب في العام الحالي.' };
    }

    const years = this.getAcademicYears();
    const stages = this.getStages();
    const grades = this.getGrades();
    const classes = this.getClasses();
    const subjects = this.getSubjects();
    const exams = this.getExams();
    const examSubjects = this.getExamSubjects();
    const results = this.getResults();

    const fullLookups: StudentFullResultLookup[] = [];

    // For each published exam that this student took
    for (const enrollment of enrollments) {
      const year = years.find(y => y.id === enrollment.academic_year_id) || {
        id: enrollment.academic_year_id,
        name: 'العام الحالي',
        start_date: '',
        end_date: '',
        is_active: true,
        created_at: ''
      };

      const stage = stages.find(s => s.id === enrollment.stage_id) || { id: '', name: 'المرحلة', description: '', display_order: 1 };
      const grade = grades.find(g => g.id === enrollment.grade_id) || { id: '', stage_id: '', name: 'الصف', display_order: 1 };
      const cls = classes.find(c => c.id === enrollment.class_id) || { id: '', grade_id: '', academic_year_id: '', name: 'فصل عام' };

      // Find published exams for this year / stage
      const publishedExams = exams.filter(e => e.academic_year_id === enrollment.academic_year_id && e.is_published);

      for (const exam of publishedExams) {
        const thisExamSubjects = examSubjects.filter(es => es.exam_id === exam.id);
        if (thisExamSubjects.length === 0) continue;

        const subjectsResults: StudentFullResultLookup['subjects_results'] = [];
        let totalScore = 0;
        let totalMaxScore = 0;
        let hasAnyScore = false;

        for (const es of thisExamSubjects) {
          const res = results.find(r => r.student_id === student.id && r.exam_subject_id === es.id);
          const subj = subjects.find(s => s.id === es.subject_id) || { id: es.subject_id, name: 'مادة كنسية', description: '' };
          
          if (res) hasAnyScore = true;
          const score = res ? res.score : 0;
          totalScore += score;
          totalMaxScore += es.max_score;

          subjectsResults.push({
            subject_id: es.subject_id,
            subject_name: subj.name,
            max_score: es.max_score,
            score: score,
            pass_score: es.pass_score
          });
        }

        if (hasAnyScore && totalMaxScore > 0) {
          const percentage = Number(((totalScore / totalMaxScore) * 100).toFixed(2));
          const evalInfo = this.calculateEvaluation(percentage);

          fullLookups.push({
            student,
            enrollment: {
              ...enrollment,
              academic_year: year,
              stage,
              grade,
              class_item: cls
            },
            exam,
            subjects_results: subjectsResults,
            total_score: totalScore,
            total_max_score: totalMaxScore,
            percentage,
            evaluation: evalInfo.label,
            is_pass: evalInfo.isPass
          });
        }
      }
    }

    if (fullLookups.length === 0) {
      return {
        success: false,
        error: `الطالب "${student.full_name}" مسجل بالمدرسة، ولكن لم يتم اعتماد ونشر أي نتائج امتحانات له حتى الآن. يرجى مراجعة إدارة الكنترول بالمدرسة.`
      };
    }

    return {
      success: true,
      data: fullLookups
    };
  }

  // --- Import Batches ---
  getImportBatches(): ImportBatch[] {
    return this.get<ImportBatch[]>(STORAGE_KEYS.BATCHES, []);
  }

  saveImportBatch(batch: ImportBatch): void {
    const list = this.getImportBatches();
    list.unshift(batch);
    this.set(STORAGE_KEYS.BATCHES, list);
  }

  // --- Admins & Auth ---
  getAdminProfiles(): AdminProfile[] {
    return this.get<AdminProfile[]>(STORAGE_KEYS.ADMINS, []);
  }

  saveAdminProfile(admin: AdminProfile): void {
    const list = this.getAdminProfiles();
    const idx = list.findIndex(a => a.id === admin.id);
    if (idx >= 0) list[idx] = admin;
    else list.push(admin);
    this.set(STORAGE_KEYS.ADMINS, list);
  }

  deleteAdminProfile(id: string): boolean {
    const list = this.getAdminProfiles();
    // Prevent deleting all super admins
    const remaining = list.filter(a => a.id !== id);
    this.set(STORAGE_KEYS.ADMINS, remaining);
    return true;
  }

  getActiveAdmin(): AdminProfile | null {
    return this.get<AdminProfile | null>(STORAGE_KEYS.ACTIVE_ADMIN, null);
  }

  setActiveAdmin(admin: AdminProfile | null): void {
    this.set(STORAGE_KEYS.ACTIVE_ADMIN, admin);
  }

  // Destructive resets are disabled for the live school database.
  resetAllData(): void {
    console.warn('resetAllData is disabled for the live school database.');
  }
}

export const dataService = new DataService();
